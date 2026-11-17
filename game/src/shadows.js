// The shadows: one table of kinds in config.js, one behaviour per kind here. Wisps swarm,
// flitters weave, gnawers hunt stars, hulks snap silk, lurkers spit orbs from afar, mires split,
// and the Eclipse rings the sky with orbs and calls the swarm.
import { SHADOWS, VIEW } from './config.js';

export function makeShadow(type, x, y, rng, watchIndex = 0) {
  const kind = SHADOWS[type];
  const toughness = 1 + 0.07 * watchIndex;
  const hp = kind.hp * (type === 'eclipse' ? 1 : toughness);
  return {
    type,
    x,
    y,
    vx: 0,
    vy: 0,
    r: kind.r,
    hp,
    maxHp: hp,
    speed: kind.speed * (type === 'eclipse' ? 1 : rng.range(0.9, 1.12)),
    phase: rng.next() * Math.PI * 2,
    seed: rng.next() * 1000,
    flash: 0,
    slow: 0,
    cooldown: rng.range(1.2, 2.6),
    summon: 6,
    dead: false,
    age: 0,
  };
}

function steer(s, tx, ty, speed, dt, turn = 4) {
  const dx = tx - s.x;
  const dy = ty - s.y;
  const d = Math.hypot(dx, dy) || 1;
  const k = Math.min(1, turn * dt);
  s.vx += ((dx / d) * speed - s.vx) * k;
  s.vy += ((dy / d) * speed - s.vy) * k;
}

function nearestStar(s, stars) {
  let best = null;
  let bd = Infinity;
  for (const st of stars) {
    const d = (st.x - s.x) ** 2 + (st.y - s.y) ** 2;
    if (d < bd) {
      bd = d;
      best = st;
    }
  }
  return best;
}

/** Fire a slow dark orb from (x, y) toward angle a. */
export function fireOrb(world, x, y, a, speed = 150, r = 7) {
  world.orbs.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r, life: 7 });
}

const BEHAVIOURS = {
  wisp(s, w, dt) {
    const wob = Math.sin(s.age * 3 + s.phase) * 40;
    steer(s, w.weaver.x + wob, w.weaver.y - wob * 0.5, s.speed, dt, 3);
  },
  flitter(s, w, dt) {
    const dx = w.weaver.x - s.x;
    const dy = w.weaver.y - s.y;
    const d = Math.hypot(dx, dy) || 1;
    const side = Math.sin(s.age * 4.2 + s.phase) * 1.3;
    steer(s, s.x + dx / d * 60 - (dy / d) * side * 60, s.y + dy / d * 60 + (dx / d) * side * 60, s.speed, dt, 5);
  },
  gnawer(s, w, dt) {
    const star = nearestStar(s, w.loom.stars);
    if (star) {
      steer(s, star.x, star.y, s.speed * 1.15, dt, 4);
      if (Math.hypot(star.x - s.x, star.y - s.y) < s.r + 8) w.eatStar(star, s);
    } else steer(s, w.weaver.x, w.weaver.y, s.speed, dt, 3);
  },
  hulk(s, w, dt) {
    steer(s, w.weaver.x, w.weaver.y, s.speed, dt, 1.5);
  },
  lurker(s, w, dt) {
    const dx = w.weaver.x - s.x;
    const dy = w.weaver.y - s.y;
    const d = Math.hypot(dx, dy) || 1;
    const want = d > 280 ? 1 : d < 210 ? -1 : 0;
    const orbit = Math.sin(s.phase) > 0 ? 1 : -1;
    steer(s, s.x + (dx / d) * want * 80 - (dy / d) * orbit * 50, s.y + (dy / d) * want * 80 + (dx / d) * orbit * 50, s.speed, dt, 3);
    s.cooldown -= dt;
    if (s.cooldown <= 0 && s.x > 0 && s.x < VIEW.width && s.y > 0 && s.y < VIEW.height) {
      s.cooldown = w.rng.range(2.4, 3.2);
      fireOrb(w, s.x, s.y, Math.atan2(dy, dx), 170);
      w.emit('spit', s);
    }
  },
  mire(s, w, dt) {
    steer(s, w.weaver.x, w.weaver.y, s.speed, dt, 2);
  },
  eclipse(s, w, dt) {
    const enraged = s.hp < s.maxHp * 0.5;
    const tx = w.weaver.x + Math.sin(s.age * 0.4) * 220;
    const ty = Math.min(VIEW.height * 0.45, w.weaver.y - 160) + Math.cos(s.age * 0.6) * 40;
    steer(s, tx, Math.max(120, ty), s.speed * (enraged ? 1.6 : 1), dt, 0.8);
    s.cooldown -= dt;
    if (s.cooldown <= 0) {
      s.cooldown = enraged ? 2.6 : 3.8;
      const n = enraged ? 18 : 12;
      const spin = s.age * 0.7;
      for (let i = 0; i < n; i += 1) fireOrb(w, s.x, s.y, spin + (i / n) * Math.PI * 2, enraged ? 140 : 115, 8);
      w.emit('eclipsePulse', s);
    }
    s.summon -= dt;
    if (s.summon <= 0) {
      s.summon = enraged ? 6 : 8.5;
      for (let i = 0; i < (enraged ? 6 : 4); i += 1) {
        const a = (i / 4) * Math.PI * 2 + s.age;
        w.spawnShadow(enraged && i % 2 ? 'flitter' : 'wisp', s.x + Math.cos(a) * 90, s.y + Math.sin(a) * 90);
      }
    }
  },
};

export function updateShadows(world, dt) {
  const list = world.shadows;
  for (const s of list) {
    if (s.dead) continue;
    s.age += dt;
    s.flash = Math.max(0, s.flash - dt * 6);
    BEHAVIOURS[s.type](s, world, dt);
    const slowK = 1 - s.slow;
    s.x += s.vx * slowK * dt;
    s.y += s.vy * slowK * dt;
    s.slow = Math.max(0, s.slow - dt * 2.5);
  }
  // Keep the swarm from stacking into one blob: a light push between overlapping shadows.
  for (let i = 0; i < list.length; i += 1) {
    const a = list[i];
    for (let j = i + 1; j < list.length; j += 1) {
      const b = list[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const min = a.r + b.r;
      const d2 = dx * dx + dy * dy;
      if (d2 > 0 && d2 < min * min) {
        const d = Math.sqrt(d2);
        const push = (min - d) * 0.5;
        const wa = b.r / min;
        const wb = a.r / min;
        a.x -= (dx / d) * push * wa;
        a.y -= (dy / d) * push * wa;
        b.x += (dx / d) * push * wb;
        b.y += (dy / d) * push * wb;
      }
    }
  }
}

export function updateOrbs(world, dt) {
  world.orbs = world.orbs.filter((o) => {
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.life -= dt;
    return o.life > 0 && o.x > -60 && o.x < VIEW.width + 60 && o.y > -60 && o.y < VIEW.height + 60;
  });
}
