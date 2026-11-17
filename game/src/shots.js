// The screenshot scenes behind ?shot=<name>&seed=N. Each one builds a real run with the game's
// own rules: it sets the watch and boons, places shadows and stars, plays the world forward a
// few steps (so sparks, slows and orbs are mid-flight), then fires the loom where the scene needs
// it. The same seed always paints the same frame.
//   cover   - the Sixth Watch at full tilt: a nova closing on a swarm while new silk burns
//   title   - the title screen with how-to-play and the bestiary
//   boons   - the boon choice after a watch
//   boss    - the Last Watch against the Eclipse
//   victory - dawn: the results screen with stats and restart
import { STEP } from './config.js';
import { deriveStats } from './boons.js';
import { closeConstellation } from './loom.js';
import { resetRun, startWatch, stepWorld, PHASE_BOON, PHASE_VICTORY } from './world.js';

const IDLE = { moveX: 0, moveY: 0, aimX: 0, aimY: 0, place: false, close: false, unravel: false, dash: false };

function setBoons(world, levels) {
  world.levels = { ...levels };
  world.stats = deriveStats(world.levels);
  world.stats_.boons = Object.keys(levels);
}

function shadow(world, type, x, y, vx = 0, vy = 0) {
  const s = world.spawnShadow(type, x, y);
  s.vx = vx;
  s.vy = vy;
  return s;
}

function stars(world, pts) {
  for (const [x, y] of pts) world.loom.stars.push({ x, y, age: 1, threadHp: 100 });
}

function run(world, seconds, input = IDLE) {
  for (let i = 0; i < seconds / STEP; i += 1) {
    world.weaver.grace = 5;
    world.dust = 100;
    stepWorld(world, input, STEP);
  }
  world.weaver.grace = 0;
}

function sign(world, name, pts) {
  world.loom.signs.push({ name, pts: pts.map(([x, y]) => ({ x, y })), age: 9 });
}

/** A swarm in a loose disc around (cx, cy), drifting toward (tx, ty). */
function swarm(world, type, n, cx, cy, radius, tx, ty, speed = 60) {
  for (let i = 0; i < n; i += 1) {
    const a = world.rng.next() * Math.PI * 2;
    const r = Math.sqrt(world.rng.next()) * radius;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    const d = Math.hypot(tx - x, ty - y) || 1;
    shadow(world, type, x, y, ((tx - x) / d) * speed, ((ty - y) / d) * speed);
  }
}

function stageCover(world, app) {
  resetRun(world);
  setBoons(world, { wider: 1, searing: 1, supernova: 1, twin: 1, afterglow: 1, reach: 1 });
  startWatch(world, 5);
  world.banner = 0;
  world.watchTime = 31;
  world.score = 31840;
  world.harmony = 5;
  world.stats_.kills = 412;
  world.weaver.light = 78;
  world.weaver.x = 520;
  world.weaver.y = 430;
  world.weaver.facing = -0.4;
  world.director.tick = () => {};
  sign(world, 'The Wandering Harp', [[90, 150], [170, 118], [236, 170], [150, 232]]);
  sign(world, 'The Iron Owl', [[1040, 520], [1130, 470], [1210, 540], [1120, 600]]);
  // The shape about to close: a swarm caught inside it on the right.
  swarm(world, 'wisp', 14, 900, 300, 95, 600, 420, 70);
  swarm(world, 'flitter', 3, 880, 300, 70, 600, 420, 90);
  shadow(world, 'mire', 940, 280, -40, 20);
  shadow(world, 'gnawer', 840, 350, -60, 10);
  // A stream of wisps and a hulk pressing on the open chain on the left.
  swarm(world, 'wisp', 9, 300, 300, 80, 520, 430, 80);
  shadow(world, 'hulk', 360, 520, 30, -20);
  shadow(world, 'gnawer', 250, 420, 60, 0);
  shadow(world, 'lurker', 640, 120, 0, 20);
  shadow(world, 'lurker', 1150, 220, -20, 10);
  shadow(world, 'flitter', 560, 210, 0, 60);
  shadow(world, 'flitter', 720, 560, -50, -30);
  swarm(world, 'wisp', 6, 1150, 380, 60, 700, 420, 70);
  swarm(world, 'wisp', 8, 150, 560, 70, 520, 430, 70);
  swarm(world, 'flitter', 3, 760, 600, 60, 520, 430, 80);
  shadow(world, 'mire', 1010, 570, -40, -20);
  swarm(world, 'wisp', 5, 420, 80, 60, 520, 430, 70);
  stars(world, [[760, 230], [1010, 200], [1060, 380], [930, 430], [770, 380]]);
  run(world, 0.5);
  world.fx.particles.length = 0;
  closeConstellation(world);
  stars(world, [[300, 470], [250, 330], [400, 245], [540, 300]]);
  for (let i = 0; i < 3; i += 1) world.orbs.push({ x: 600 + i * 40, y: 180 + i * 50, vx: -40, vy: 120, r: 7, life: 5 });
  run(world, 0.3);
  for (const [tx, ty, k] of [[390, 495, 0.45], [400, 495, 0.75], [380, 345, 0.55], [640, 545, 0.6]]) {
    const a = Math.atan2(ty - 430, tx - 520);
    const d = Math.hypot(tx - 520, ty - 430) * k;
    world.bolts.push({ x: 520 + Math.cos(a) * d, y: 430 + Math.sin(a) * d, vx: Math.cos(a) * 620, vy: Math.sin(a) * 620, life: 0.3 });
  }
  world.loom.stars[1].strain = 0;
  world.loom.stars[0].strain = 0.2;
  app.time = 12.3;
  return { aim: { x: 650, y: 330 }, mouse: { x: 650, y: 330 } };
}

function stageBoss(world, app) {
  resetRun(world);
  setBoons(world, { wider: 2, searing: 2, supernova: 2, twin: 2, afterglow: 1, echo: 1, quick: 1, mend: 2 });
  startWatch(world, 7);
  world.banner = 0;
  world.director.tick = () => {};
  const boss = world.boss;
  boss.x = 640;
  boss.y = 250;
  boss.hp = boss.maxHp * 0.42;
  boss.age = 30;
  boss.cooldown = 99;
  boss.summon = 99;
  world.score = 61220;
  world.harmony = 6;
  world.stats_.kills = 980;
  world.weaver.light = 64;
  world.weaver.x = 470;
  world.weaver.y = 470;
  sign(world, 'The Crowned Serpent', [[80, 120], [190, 90], [250, 190], [120, 240]]);
  sign(world, 'The Last Spindle', [[1060, 110], [1200, 150], [1150, 260]]);
  for (let i = 0; i < 18; i += 1) {
    const a = (i / 18) * Math.PI * 2 + 0.3;
    const r = 150 + (i % 2) * 40;
    world.orbs.push({ x: 640 + Math.cos(a) * r, y: 250 + Math.sin(a) * r * 0.9, vx: Math.cos(a) * 130, vy: Math.sin(a) * 130, r: 8, life: 5 });
  }
  swarm(world, 'wisp', 10, 900, 470, 90, 640, 300, 70);
  swarm(world, 'flitter', 4, 300, 230, 70, 640, 300, 80);
  shadow(world, 'gnawer', 760, 520, -60, 0);
  shadow(world, 'gnawer', 380, 320, 50, 30);
  shadow(world, 'lurker', 1080, 300, -10, 10);
  shadow(world, 'hulk', 200, 520, 30, -10);
  stars(world, [[500, 120], [800, 110], [850, 360], [520, 390]]);
  run(world, 0.1);
  world.fx.particles.length = 0;
  closeConstellation(world);
  boss.hp = boss.maxHp * 0.42;
  stars(world, [[330, 400], [270, 230], [400, 110], [560, 60]]);
  run(world, 0.28);
  boss.flash = 0.4;
  app.time = 31.7;
  return { aim: { x: 700, y: 50 }, mouse: { x: 700, y: 50 } };
}

function stageBoons(world, app) {
  resetRun(world);
  setBoons(world, { searing: 1, twin: 1 });
  startWatch(world, 2);
  world.director.tick = () => {};
  world.score = 9420;
  sign(world, 'The Patient Heron', [[260, 400], [380, 360], [420, 470], [300, 520]]);
  sign(world, 'The Burning Kite', [[880, 420], [1000, 380], [1060, 480]]);
  world.phase = PHASE_BOON;
  world.hand = ['wider', 'afterglow', 'comet'];
  app.time = 4;
  return { aim: null, mouse: { x: 640, y: 380 } };
}

function stageVictory(world, app, save) {
  resetRun(world);
  setBoons(world, { wider: 2, searing: 2, supernova: 2, twin: 2, afterglow: 1, echo: 1, quick: 1 });
  world.watch = 7;
  world.phase = PHASE_VICTORY;
  world.phaseTime = 4;
  world.score = 74635;
  world.time = 7 * 60 + 41;
  Object.assign(world.stats_, { kills: 1286, novas: 141, bestNet: 27, stars: 702 });
  world.shadows = [];
  world.boss = null;
  const shapes = [
    ['The Silver Heron', [[70, 90], [170, 60], [240, 120], [140, 170]]],
    ['The Last Spindle', [[1040, 70], [1180, 110], [1130, 190]]],
    ['The Weeping Fox', [[60, 420], [150, 380], [210, 470], [110, 520]]],
    ['The Crowned Anvil', [[1070, 400], [1190, 380], [1230, 480], [1120, 520]]],
  ];
  for (const [n, p] of shapes) sign(world, n, p);
  save.best = 74635;
  app.record = true;
  app.time = 8;
  return { aim: null, mouse: { x: 640, y: 577 } };
}

export function stageShot(name, world, app, save) {
  app.screen = 'play';
  if (name === 'title') {
    app.screen = 'title';
    app.time = 6.2;
    return { aim: null, mouse: { x: 640, y: 637 } };
  }
  if (name === 'boss') return stageBoss(world, app);
  if (name === 'boons') return stageBoons(world, app);
  if (name === 'victory') return stageVictory(world, app, save);
  return stageCover(world, app);
}
