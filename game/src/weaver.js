// The Weaver: a small comet-spirit the player steers with WASD. It dashes through danger with
// Shift, fires starbolts at the nearest shadow on its own, and gathers stardust as it flies.
import { LOOM, PALETTE, VIEW, WEAVER } from './config.js';
import { clamp } from './geometry.js';
import { burst } from './effects.js';

export function createWeaver() {
  return {
    x: VIEW.width / 2,
    y: VIEW.height * 0.58,
    vx: 0,
    vy: 0,
    light: WEAVER.light,
    grace: 0,
    dash: 0,
    dashCooldown: 0,
    dashX: 0,
    dashY: 0,
    boltTimer: 0.3,
    trail: [],
    facing: 0,
  };
}

function nearestShadow(world, range) {
  let best = null;
  let bd = range * range;
  const { x, y } = world.weaver;
  for (const s of world.shadows) {
    if (s.dead) continue;
    const d = (s.x - x) ** 2 + (s.y - y) ** 2;
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  return best;
}

export function updateWeaver(world, input, dt) {
  const w = world.weaver;
  const { stats, fx, rng } = world;
  let mx = input.moveX;
  let my = input.moveY;
  const len = Math.hypot(mx, my);
  if (len > 1) {
    mx /= len;
    my /= len;
  }
  w.dashCooldown = Math.max(0, w.dashCooldown - dt);
  if (input.dash && w.dashCooldown <= 0) {
    let dx = mx;
    let dy = my;
    if (Math.hypot(dx, dy) < 0.1) {
      dx = input.aimX - w.x;
      dy = input.aimY - w.y;
    }
    const d = Math.hypot(dx, dy) || 1;
    w.dashX = dx / d;
    w.dashY = dy / d;
    w.dash = WEAVER.dashTime;
    w.dashCooldown = stats.dashCooldown;
    w.grace = Math.max(w.grace, WEAVER.dashTime + 0.12);
    world.emit('dash');
  }
  if (w.dash > 0) {
    w.dash -= dt;
    w.vx = w.dashX * WEAVER.dashSpeed;
    w.vy = w.dashY * WEAVER.dashSpeed;
    burst(fx, rng, w.x, w.y, PALETTE.weaver, 3, 40, 0.4, 2.4);
    if (stats.dashBurn > 0) {
      for (const s of world.shadows) if (!s.dead && Math.hypot(s.x - w.x, s.y - w.y) < s.r + 18) world.damageShadow(s, stats.dashBurn * dt * 8, 'dash');
    }
  } else {
    const k = Math.min(1, 14 * dt);
    w.vx += (mx * WEAVER.speed - w.vx) * k;
    w.vy += (my * WEAVER.speed - w.vy) * k;
  }
  w.x = clamp(w.x + w.vx * dt, 12, VIEW.width - 12);
  w.y = clamp(w.y + w.vy * dt, 12, VIEW.horizon - 8);
  if (Math.hypot(w.vx, w.vy) > 20) w.facing = Math.atan2(w.vy, w.vx);
  w.grace = Math.max(0, w.grace - dt);
  w.trail.unshift({ x: w.x, y: w.y });
  if (w.trail.length > 18) w.trail.pop();

  // Starbolts: an automatic volley at the nearest shadow in range.
  w.boltTimer -= dt;
  if (w.boltTimer <= 0) {
    const target = nearestShadow(world, stats.boltRange);
    if (target) {
      w.boltTimer = stats.boltCooldown;
      const base = Math.atan2(target.y - w.y, target.x - w.x);
      for (let i = 0; i < stats.bolts; i += 1) {
        const a = base + (i - (stats.bolts - 1) / 2) * 0.16;
        world.bolts.push({ x: w.x, y: w.y, vx: Math.cos(a) * WEAVER.boltSpeed, vy: Math.sin(a) * WEAVER.boltSpeed, life: stats.boltRange / WEAVER.boltSpeed + 0.1 });
      }
      world.emit('bolt');
    } else w.boltTimer = 0.08;
  }

  // Stardust: drifting motes are pulled in, and the loom refills slowly on its own.
  world.dust = Math.min(LOOM.dustMax, world.dust + stats.dustRegen * dt);
  world.motes = world.motes.filter((m) => {
    m.life -= dt;
    const dx = w.x - m.x;
    const dy = w.y - m.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < stats.magnet) {
      const pull = 520 * (1 - d / stats.magnet) + 120;
      m.vx += (dx / d) * pull * dt * 6;
      m.vy += (dy / d) * pull * dt * 6;
    }
    m.vx *= 1 - 2.5 * dt;
    m.vy *= 1 - 2.5 * dt;
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    if (d < 16) {
      world.dust = Math.min(LOOM.dustMax, world.dust + m.value);
      world.emit('mote');
      return false;
    }
    return m.life > 0;
  });
}

export function updateBolts(world, dt) {
  world.bolts = world.bolts.filter((b) => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    for (const s of world.shadows) {
      if (s.dead) continue;
      if ((s.x - b.x) ** 2 + (s.y - b.y) ** 2 < (s.r + 4) ** 2) {
        world.damageShadow(s, s.type === 'eclipse' ? WEAVER.boltDamage * 0.3 : WEAVER.boltDamage, 'bolt');
        burst(world.fx, world.rng, b.x, b.y, PALETTE.bolt, 5, 120, 0.3, 1.8);
        return false;
      }
    }
    return b.life > 0;
  });
}
