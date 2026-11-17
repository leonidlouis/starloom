// Juice: sparks, rings, floating score text, screen shake and full-screen flashes. Pure data,
// advanced by the world each step and painted by the renderer.

const MAX_PARTICLES = 1400;

export function createEffects() {
  return { particles: [], rings: [], popups: [], beams: [], shake: 0, flash: 0, flashColor: '#ffffff', slowmo: 0 };
}

/** A spray of glowing sparks. */
export function burst(fx, rng, x, y, color, count, speed = 160, life = 0.7, size = 2.4) {
  for (let i = 0; i < count; i += 1) {
    if (fx.particles.length >= MAX_PARTICLES) fx.particles.shift();
    const a = rng.next() * Math.PI * 2;
    const v = speed * (0.25 + rng.next() * 0.9);
    const l = life * (0.5 + rng.next() * 0.7);
    fx.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: l, max: l, size: size * (0.6 + rng.next() * 0.8), color, drag: 2.2 });
  }
}

/** Sparks strewn along a line, used when silk burns or a shape closes. */
export function streak(fx, rng, ax, ay, bx, by, color, count, speed = 60) {
  for (let i = 0; i < count; i += 1) {
    const t = rng.next();
    burst(fx, rng, ax + (bx - ax) * t, ay + (by - ay) * t, color, 1, speed, 0.6, 2);
  }
}

export function ring(fx, x, y, color, from, to, life = 0.5, width = 3) {
  fx.rings.push({ x, y, color, from, to, life, max: life, width });
}

/** Floating text; `ui` uses the bold sans face (numbers, callouts) instead of the display serif. */
export function popup(fx, x, y, text, color = '#fff3c9', size = 18, life = 1.1, ui = false) {
  fx.popups.push({ x, y, text, color, size, life, max: life, ui });
}

/** A polygon of light: the flash of a constellation closing. */
export function beam(fx, pts, color, life = 0.9) {
  fx.beams.push({ pts: pts.map((p) => ({ x: p.x, y: p.y })), color, life, max: life });
}

export function shake(fx, amount) {
  fx.shake = Math.min(26, fx.shake + amount);
}

export function flash(fx, amount, color = '#ffffff') {
  fx.flash = Math.max(fx.flash, amount);
  fx.flashColor = color;
}

export function updateEffects(fx, dt) {
  const ps = fx.particles;
  let w = 0;
  for (let i = 0; i < ps.length; i += 1) {
    const p = ps[i];
    p.life -= dt;
    if (p.life <= 0) continue;
    const k = Math.max(0, 1 - p.drag * dt);
    p.vx *= k;
    p.vy *= k;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    ps[w++] = p;
  }
  ps.length = w;
  fx.rings = fx.rings.filter((r) => (r.life -= dt) > 0);
  fx.beams = fx.beams.filter((b) => (b.life -= dt) > 0);
  fx.popups = fx.popups.filter((p) => {
    p.life -= dt;
    p.y -= 34 * dt;
    return p.life > 0;
  });
  fx.shake = Math.max(0, fx.shake - 40 * dt);
  fx.flash = Math.max(0, fx.flash - 2.4 * dt);
  fx.slowmo = Math.max(0, fx.slowmo - dt);
}
