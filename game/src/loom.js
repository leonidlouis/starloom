// The loom, STARLOOM's twist: the Weaver pins stars into the sky, each new star spun to the last
// by a thread of burning silk. Shadows that cross silk burn and slow; hulks snap it. Close the
// shape (click the first star, or Space) and it ignites as a constellation: a nova strikes every
// shadow inside, bigger shapes and fuller nets strike harder, and the shape stays in the sky.
import { LOOM, PALETTE, VIEW } from './config.js';
import { centroid, pointInPolygon, polygonArea, segmentDistance } from './geometry.js';
import { beam, burst, flash, popup, ring, shake, streak } from './effects.js';

const ADJECTIVES = ['Silver', 'Weeping', 'Hollow', 'Burning', 'Patient', 'Drowned', 'Wandering', 'Crowned', 'Quiet', 'Lantern', 'Iron', 'Sleeping', 'Last'];
const NOUNS = ['Heron', 'Kite', 'Stag', 'Ferryman', 'Moth', 'Anvil', 'Serpent', 'Harp', 'Fox', 'Willow', 'Ship', 'Spindle', 'Owl', 'Gate'];

export function createLoom() {
  return { stars: [], signs: [], fields: [], echoes: [], placed: 0 };
}

/** Why a star cannot go at (x, y) right now, or '' when it can. */
export function placeBlocker(world, x, y) {
  const { loom, weaver, stats } = world;
  if (loom.stars.length >= stats.maxStars) return 'loom full: close the shape';
  if (world.dust < stats.starCost) return 'not enough stardust';
  if (Math.hypot(x - weaver.x, y - weaver.y) > stats.reach) return 'out of reach';
  if (y > VIEW.horizon - 6 || x < 6 || x > VIEW.width - 6 || y < 6) return 'outside the sky';
  for (const s of loom.stars) if (Math.hypot(s.x - x, s.y - y) < LOOM.minStarGap) return 'too close to a star';
  return '';
}

export function canClose(world, x, y) {
  const stars = world.loom.stars;
  return stars.length >= 3 && Math.hypot(stars[0].x - x, stars[0].y - y) < LOOM.closeRadius;
}

export function placeStar(world, x, y) {
  const why = placeBlocker(world, x, y);
  if (why) {
    world.fx.denied = { x, y, text: why, life: 0.9 };
    world.emit('deny');
    return false;
  }
  world.dust -= world.stats.starCost;
  const star = { x, y, age: 0, threadHp: LOOM.threadHp };
  world.loom.stars.push(star);
  world.loom.placed += 1;
  world.stats_.stars += 1;
  burst(world.fx, world.rng, x, y, PALETTE.star, 14, 140, 0.5, 2.2);
  ring(world.fx, x, y, PALETTE.star, 4, 34, 0.4, 2);
  world.emit('star', { index: world.loom.stars.length });
  return true;
}

/** Let go of the open chain: its stars fade and half their stardust comes back. */
export function unravel(world, silent = false) {
  const stars = world.loom.stars;
  if (stars.length === 0) return;
  for (const s of stars) burst(world.fx, world.rng, s.x, s.y, PALETTE.muted, 8, 70, 0.5, 1.8);
  world.dust = Math.min(LOOM.dustMax, world.dust + stars.length * world.stats.starCost * 0.5);
  world.loom.stars = [];
  if (!silent) world.emit('unravel');
}

export function removeStar(world, star) {
  const stars = world.loom.stars;
  const i = stars.indexOf(star);
  if (i < 0) return;
  stars.splice(i, 1);
  burst(world.fx, world.rng, star.x, star.y, PALETTE.eye, 16, 150, 0.6, 2.4);
  if (stars[i]) stars[i].threadHp = LOOM.threadHp;
}

function constellationName(rng, n) {
  return `The ${rng.pick(ADJECTIVES)} ${rng.pick(NOUNS)}`;
}

/** Strike every shadow inside the shape; returns how many it hit. */
function strike(world, pts, damage, label) {
  let hits = 0;
  for (const s of world.shadows) {
    if (s.dead) continue;
    let inside = pointInPolygon(s.x, s.y, pts);
    if (!inside) {
      for (let i = 0; i < pts.length && !inside; i += 1) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        if (segmentDistance(s.x, s.y, a.x, a.y, b.x, b.y) < s.r + 10) inside = true;
      }
    }
    if (!inside) continue;
    hits += 1;
    world.damageShadow(s, damage, 'nova');
  }
  if (label) world.stats_.bestNet = Math.max(world.stats_.bestNet, hits);
  return hits;
}

/** Close the open chain into a constellation and fire its nova. */
export function closeConstellation(world) {
  const stars = world.loom.stars;
  if (stars.length < 3) {
    world.emit('deny');
    world.fx.denied = { x: world.weaver.x, y: world.weaver.y - 30, text: 'need 3 stars to close', life: 0.9 };
    return false;
  }
  const pts = stars.map((s) => ({ x: s.x, y: s.y }));
  const area = polygonArea(pts);
  // A full loom (every star slot used) is a Grand Constellation: a third more power, a risk rewarded.
  const grand = pts.length >= world.stats.maxStars;
  const damage = (LOOM.novaBase + LOOM.novaPerStar * pts.length) * (1 + Math.min(1.5, area * LOOM.novaAreaBonus)) * world.stats.novaMult * (grand ? 1.35 : 1);
  const c = centroid(pts);
  const name = constellationName(world.rng, pts.length);
  const hits = strike(world, pts, damage, name);
  const { fx, rng } = world;
  beam(fx, pts, PALETTE.nova, 1.0);
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    streak(fx, rng, a.x, a.y, b.x, b.y, PALETTE.silkHot, 26, 90);
    burst(fx, rng, a.x, a.y, PALETTE.starCore, 18, 220, 0.8, 2.6);
  }
  ring(fx, c.x, c.y, PALETTE.nova, 10, Math.sqrt(area) * 0.9 + 40, 0.7, 5);
  shake(fx, 6 + Math.min(14, hits * 1.5));
  flash(fx, 0.18 + Math.min(0.25, hits * 0.02), PALETTE.nova);
  const bonus = 5 * hits * hits + 10 * hits * pts.length;
  if (hits >= 3) world.harmony = Math.min(8, world.harmony + 1);
  // A full net warms the Weaver: big catches give back a little light.
  if (hits >= 4) {
    const w = world.weaver;
    const heal = Math.min(12, hits * 0.9);
    w.light = Math.min(world.stats.maxLight, w.light + heal);
    popup(fx, w.x, w.y - 24, `+${Math.round(heal)} light`, PALETTE.light, 19, 1.1);
  }
  world.addScore(bonus);
  const bossHit = world.boss && !world.boss.dead && pointInPolygon(world.boss.x, world.boss.y, pts);
  const ny = bossHit ? Math.min(...pts.map((p) => p.y)) + 30 : c.y - 10;
  popup(fx, c.x, ny, grand ? `${name}  ·  Grand` : name, PALETTE.silkHot, 32, 1.8);
  const caught = bossHit ? `The Eclipse is struck  ·  ${Math.round(damage)}` : hits > 0 ? `${hits} caught  +${Math.round(bonus * world.harmony).toLocaleString('en-US')}` : 'empty sky';
  popup(fx, c.x, ny + 32, caught, hits > 0 ? PALETTE.nova : PALETTE.muted, 22, 1.6);
  world.loom.signs.push({ pts, name, age: 0 });
  if (world.loom.signs.length > 6) world.loom.signs.shift();
  if (world.stats.afterglow > 0) world.loom.fields.push({ pts, life: world.stats.afterglow, dps: damage * 0.35 });
  if (world.stats.echo > 0) world.loom.echoes.push({ pts, delay: 0.55, damage: damage * world.stats.echo });
  world.loom.stars = [];
  world.stats_.novas += 1;
  world.emit('nova', { hits, stars: pts.length });
  return true;
}

export function updateLoom(world, dt) {
  const { loom, stats } = world;
  for (const s of loom.stars) s.age += dt;
  for (const sg of loom.signs) sg.age += dt;
  // Silk: each thread runs from star i-1 to star i, plus a faint guide from the last star to the Weaver.
  for (let i = 1; i < loom.stars.length; i += 1) {
    const a = loom.stars[i - 1];
    const b = loom.stars[i];
    for (const s of world.shadows) {
      if (s.dead) continue;
      if (segmentDistance(s.x, s.y, a.x, a.y, b.x, b.y) > s.r + 4) continue;
      const mult = s.type === 'eclipse' ? 0.5 : 1;
      world.damageShadow(s, stats.threadDps * mult * dt, 'silk');
      s.slow = Math.max(s.slow, stats.slow);
      if (world.rng.chance(dt * 18)) burst(world.fx, world.rng, s.x, s.y, PALETTE.silkHot, 1, 90, 0.4, 2);
      if (s.type === 'hulk' || s.type === 'eclipse') {
        b.threadHp -= 140 * dt;
        b.strain = 0.2;
      }
    }
    if (b.strain) b.strain = Math.max(0, b.strain - dt);
    if (b.threadHp <= 0) {
      streak(world.fx, world.rng, a.x, a.y, b.x, b.y, PALETTE.eye, 20, 80);
      world.emit('snap');
      removeStar(world, b);
      i -= 1;
    }
  }
  loom.fields = loom.fields.filter((f) => {
    f.life -= dt;
    for (const s of world.shadows) if (!s.dead && pointInPolygon(s.x, s.y, f.pts)) world.damageShadow(s, f.dps * dt, 'glow');
    return f.life > 0;
  });
  loom.echoes = loom.echoes.filter((e) => {
    e.delay -= dt;
    if (e.delay > 0) return true;
    strike(world, e.pts, e.damage, '');
    beam(world.fx, e.pts, PALETTE.star, 0.6);
    shake(world.fx, 4);
    world.emit('echo');
    return false;
  });
}
