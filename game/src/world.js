// The run: one night of eight watches. Holds every live thing (Weaver, loom, shadows, bolts,
// orbs, stardust), advances them each fixed step, applies contact and damage rules, and moves
// the run between its phases: a watch in play, the dawn bell, the boon choice, victory, defeat.
import { LOOM, PALETTE, SHADOWS, VIEW, WATCH_COUNT } from './config.js';
import { createRng } from './rng.js';
import { burst, createEffects, flash, popup, ring, shake, updateEffects } from './effects.js';
import { createLoom, canClose, closeConstellation, placeStar, removeStar, unravel, updateLoom } from './loom.js';
import { createWeaver, updateBolts, updateWeaver } from './weaver.js';
import { makeShadow, updateOrbs, updateShadows } from './shadows.js';
import { createDirector, WATCHES } from './waves.js';
import { boonById, dealBoons, deriveStats } from './boons.js';

export const PHASE_WATCH = 'watch';
export const PHASE_DAWNBELL = 'dawnbell';
export const PHASE_BOON = 'boon';
export const PHASE_VICTORY = 'victory';
export const PHASE_DEFEAT = 'defeat';

export function createWorld(seed) {
  const world = {
    rng: createRng(seed),
    events: [],
    emit(type, data) {
      world.events.push({ type, data });
    },
  };
  bindVerbs(world);
  resetRun(world);
  return world;
}

export function resetRun(world) {
  Object.assign(world, {
    phase: PHASE_WATCH,
    phaseTime: 0,
    watch: 0,
    watchTime: 0,
    time: 0,
    weaver: createWeaver(),
    loom: createLoom(),
    shadows: [],
    bolts: [],
    orbs: [],
    motes: [],
    fx: createEffects(),
    dust: LOOM.dustStart,
    score: 0,
    harmony: 1,
    levels: {},
    hand: [],
    boss: null,
    banner: 0,
    stats_: { kills: 0, novas: 0, stars: 0, bestNet: 0, hurt: 0, boons: [] },
  });
  world.stats = deriveStats(world.levels);
  world.weaver.light = world.stats.maxLight;
  startWatch(world, 0);
}

export function startWatch(world, index) {
  world.watch = index;
  world.watchTime = 0;
  world.phase = PHASE_WATCH;
  world.phaseTime = 0;
  world.banner = 3.2;
  world.director = createDirector(index, world.rng, (type, x, y) => world.spawnShadow(type, x, y), () => world.shadows.length);
  const boss = WATCHES[index].boss;
  if (boss) {
    world.boss = world.spawnShadow(boss, VIEW.width / 2, -80);
    world.emit('bossRise');
  }
  world.emit('watch', { index });
}

/** Wire the world's verbs the systems call back into. */
function bindVerbs(world) {
  world.spawnShadow = (type, x, y) => {
    const s = makeShadow(type, x, y, world.rng, world.watch);
    world.shadows.push(s);
    return s;
  };
  world.addScore = (n) => {
    world.score += Math.round(n * world.harmony);
  };
  world.eatStar = (star, by) => {
    removeStar(world, star);
    popup(world.fx, star.x, star.y - 14, 'STAR EATEN!', PALETTE.danger, 18, 1.1, true);
    world.emit('eaten');
    by.hp += 6;
  };
  world.damageShadow = (s, amount, source) => {
    if (s.dead) return;
    s.hp -= amount;
    if (source !== 'silk' && source !== 'glow') s.flash = 1;
    else s.flash = Math.max(s.flash, 0.35);
    if (source === 'nova' && (s.type === 'hulk' || s.type === 'eclipse')) {
      popup(world.fx, s.x, s.y - s.r - 8, `-${Math.round(amount)}`, '#ff6b7f', 22, 0.9, true);
    }
    if (s.hp <= 0) killShadow(world, s, source);
  };
}

function killShadow(world, s, source) {
  s.dead = true;
  const kind = SHADOWS[s.type];
  const { fx, rng } = world;
  world.stats_.kills += 1;
  world.addScore(kind.score);
  burst(fx, rng, s.x, s.y, PALETTE.ink, Math.round(s.r * 0.9), 120, 0.8, s.r * 0.28);
  burst(fx, rng, s.x, s.y, PALETTE.eye, Math.round(s.r * 0.6), 180, 0.6, 2.2);
  burst(fx, rng, s.x, s.y, source === 'nova' ? PALETTE.nova : PALETTE.star, 6, 140, 0.5, 2);
  ring(fx, s.x, s.y, PALETTE.inkRim, s.r * 0.5, s.r * 2.2, 0.35, 2);
  for (let i = 0; i < kind.dust; i += 1) {
    const a = rng.next() * Math.PI * 2;
    world.motes.push({ x: s.x, y: s.y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, value: 1.6, life: 9 });
  }
  if (s.type === 'mire') for (let i = 0; i < 3; i += 1) world.spawnShadow('wisp', s.x + rng.range(-18, 18), s.y + rng.range(-18, 18));
  if (s.type === 'hulk') shake(fx, 6);
  if (s.type === 'eclipse') {
    shake(fx, 26);
    flash(fx, 0.9, PALETTE.dawn);
    for (let i = 0; i < 6; i += 1) ring(fx, s.x, s.y, i % 2 ? PALETTE.nova : PALETTE.dawn, 20, 300 + i * 120, 1.2 + i * 0.25, 6);
    burst(fx, rng, s.x, s.y, PALETTE.nova, 160, 520, 1.6, 3.4);
    world.fx.slowmo = 1.6;
    world.emit('bossDown');
  }
  world.emit('kill', { type: s.type });
}

function hurtWeaver(world, amount, x, y) {
  const w = world.weaver;
  if (w.grace > 0 || world.phase !== PHASE_WATCH) return;
  w.light -= amount;
  w.grace = 0.75;
  world.harmony = 1;
  world.stats_.hurt += amount;
  shake(world.fx, 9);
  flash(world.fx, 0.35, PALETTE.danger);
  burst(world.fx, world.rng, w.x, w.y, PALETTE.danger, 16, 200, 0.5, 2.2);
  const a = Math.atan2(w.y - y, w.x - x);
  w.vx += Math.cos(a) * 320;
  w.vy += Math.sin(a) * 320;
  world.emit('hurt');
  if (w.light <= 0) {
    w.light = 0;
    world.phase = PHASE_DEFEAT;
    world.phaseTime = 0;
    burst(world.fx, world.rng, w.x, w.y, PALETTE.weaver, 90, 360, 1.4, 3);
    shake(world.fx, 22);
    world.fx.slowmo = 1.2;
    world.emit('defeat');
  }
}

function resolveContacts(world) {
  const w = world.weaver;
  for (const s of world.shadows) {
    if (s.dead) continue;
    if ((s.x - w.x) ** 2 + (s.y - w.y) ** 2 < (s.r + 9) ** 2) hurtWeaver(world, SHADOWS[s.type].touch, s.x, s.y);
  }
  for (const o of world.orbs) {
    if ((o.x - w.x) ** 2 + (o.y - w.y) ** 2 < (o.r + 8) ** 2) {
      o.life = 0;
      hurtWeaver(world, 9, o.x, o.y);
    }
  }
}

/** Ring the dawn bell: every shadow left in the sky burns away. */
function ringDawnBell(world) {
  world.phase = PHASE_DAWNBELL;
  world.phaseTime = 0;
  for (const s of world.shadows) {
    if (s.dead) continue;
    s.dead = true;
    burst(world.fx, world.rng, s.x, s.y, PALETTE.dawn, 10, 140, 0.9, 2.2);
  }
  world.orbs = [];
  unravel(world, true);
  const bonus = 150 * (world.watch + 1);
  world.addScore(bonus);
  popup(world.fx, VIEW.width / 2, VIEW.height / 2 + 40, `Watch held  +${bonus * world.harmony}`, PALETTE.dawn, 34, 2.2);
  flash(world.fx, 0.4, PALETTE.dawn);
  world.emit('dawnbell');
}

/** Take the boon at `slot` of the hand and begin the next watch. */
export function chooseBoon(world, slot) {
  if (world.phase !== PHASE_BOON) return false;
  const id = world.hand[slot];
  if (!id) return false;
  world.levels[id] = (world.levels[id] ?? 0) + 1;
  world.stats_.boons.push(id);
  const before = world.stats.maxLight;
  world.stats = deriveStats(world.levels);
  const w = world.weaver;
  w.light = Math.min(world.stats.maxLight, w.light + (world.stats.maxLight - before) + (id === 'mend' ? 40 : 0) + 15);
  world.emit('boon', { id, name: boonById(id).name });
  startWatch(world, world.watch + 1);
  return true;
}

/**
 * One fixed step. `input` carries this step's movement, aim and one-shot presses:
 * { moveX, moveY, aimX, aimY, place, close, unravel, dash }.
 */
export function stepWorld(world, input, dt) {
  const fx = world.fx;
  const scaled = fx.slowmo > 0 ? dt * 0.35 : dt;
  world.time += dt;
  world.phaseTime += dt;
  world.banner = Math.max(0, world.banner - dt);
  if (world.fx.denied) {
    world.fx.denied.life -= dt;
    if (world.fx.denied.life <= 0) world.fx.denied = null;
  }
  if (world.phase === PHASE_WATCH) {
    world.watchTime += scaled;
    world.director.tick(scaled);
    if (input.place) {
      if (canClose(world, input.aimX, input.aimY)) closeConstellation(world);
      else placeStar(world, input.aimX, input.aimY);
    }
    if (input.close) closeConstellation(world);
    if (input.unravel) unravel(world);
    updateWeaver(world, input, scaled);
    updateLoom(world, scaled);
    updateShadows(world, scaled);
    updateBolts(world, scaled);
    updateOrbs(world, scaled);
    resolveContacts(world);
    world.shadows = world.shadows.filter((s) => !s.dead);
    const watch = WATCHES[world.watch];
    if (world.phase === PHASE_WATCH) {
      if (watch.boss ? world.boss && world.boss.dead : world.watchTime >= watch.duration) {
        if (world.watch + 1 >= WATCH_COUNT) {
          world.phase = PHASE_VICTORY;
          world.phaseTime = 0;
          world.addScore(Math.round(world.weaver.light) * 20);
          // Dawn breaks: every remaining shadow and orb burns away, the open chain is let go.
          for (const s of world.shadows) burst(world.fx, world.rng, s.x, s.y, PALETTE.dawn, 12, 160, 1, 2.4);
          world.shadows = [];
          world.orbs = [];
          unravel(world, true);
          world.emit('victory');
        } else ringDawnBell(world);
      }
    }
  } else if (world.phase === PHASE_DAWNBELL) {
    updateWeaver(world, { ...input, place: false, dash: false }, dt);
    world.motes.forEach((m) => {
      m.x += (world.weaver.x - m.x) * 4 * dt;
      m.y += (world.weaver.y - m.y) * 4 * dt;
    });
    world.shadows = [];
    if (world.phaseTime > 2.2) {
      world.phase = PHASE_BOON;
      world.phaseTime = 0;
      world.hand = dealBoons(world.rng, world.levels);
      world.emit('hand');
    }
  } else if (world.phase === PHASE_DEFEAT || world.phase === PHASE_VICTORY) {
    updateShadows(world, scaled * 0.4);
    world.loom.signs.forEach((s) => (s.age += dt));
  }
  updateEffects(fx, dt);
}

/** True once a finished run's end screen may take a restart press. */
export function endSettled(world) {
  return (world.phase === PHASE_VICTORY || world.phase === PHASE_DEFEAT) && world.phaseTime > 1.4;
}

/** The run's grade on the results screen: S for a dawn reached nearly unhurt, down to D. */
export function runGrade(world) {
  const won = world.phase === PHASE_VICTORY;
  if (won) return world.stats_.hurt < 150 ? 'S' : 'A';
  if (world.watch >= 5) return 'B';
  if (world.watch >= 3) return 'C';
  return 'D';
}
