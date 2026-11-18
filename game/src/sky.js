// The backdrop: a deep indigo sky with painted nebulae, a twinkling starfield, a far ridge with
// the old observatory, and the slow warm-up of dawn on the horizon. The static layers are
// painted once into an offscreen canvas; only twinkle and dawn change per frame.
import { PALETTE, VIEW } from './config.js';
import { createRng } from './rng.js';
import { drawGlow, rgba } from './sprites.js';

function paintNebula(g, rng) {
  const blobs = [
    ['#2b8fb8', 0.1, 0.16, 0.22, 380],
    ['#8a2f9e', 0.74, 0.28, 0.2, 420],
    ['#3d2a9c', 0.45, 0.45, 0.2, 460],
    ['#c2477a', 0.86, 0.7, 0.13, 300],
    ['#1f6f8c', 0.22, 0.72, 0.12, 300],
  ];
  g.globalCompositeOperation = 'lighter';
  for (const [color, fx, fy, alpha, size] of blobs) {
    for (let i = 0; i < 22; i += 1) {
      const x = fx * VIEW.width + rng.range(-size, size) * 0.8;
      const y = fy * VIEW.height + rng.range(-size, size) * 0.35;
      const r = rng.range(size * 0.25, size * 0.6);
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, rgba(color, alpha * rng.range(0.2, 0.5)));
      grad.addColorStop(1, rgba(color, 0));
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  // A faint milky band across the sky.
  for (let i = 0; i < 900; i += 1) {
    const t = rng.next();
    const x = t * VIEW.width;
    const y = 120 + t * 300 + rng.range(-70, 70) * (0.5 + rng.next());
    g.fillStyle = `rgba(200,210,255,${rng.range(0.03, 0.12)})`;
    g.fillRect(x, y, 1.2, 1.2);
  }
  g.globalCompositeOperation = 'source-over';
}

function paintRidge(g, rng) {
  const base = VIEW.horizon;
  const far = [];
  for (let x = -20; x <= VIEW.width + 20; x += 20) far.push([x, base - 26 - Math.sin(x * 0.006) * 18 - Math.sin(x * 0.017 + 1) * 9 - rng.range(0, 5)]);
  g.fillStyle = '#120a26';
  g.beginPath();
  g.moveTo(-20, VIEW.height);
  for (const [x, y] of far) g.lineTo(x, y);
  g.lineTo(VIEW.width + 20, VIEW.height);
  g.fill();
  const near = [];
  for (let x = -20; x <= VIEW.width + 20; x += 14) near.push([x, base + 4 - Math.sin(x * 0.004 + 2) * 22 - Math.sin(x * 0.021) * 6 - rng.range(0, 3)]);
  g.fillStyle = PALETTE.ridge;
  g.beginPath();
  g.moveTo(-20, VIEW.height);
  for (const [x, y] of near) g.lineTo(x, y);
  g.lineTo(VIEW.width + 20, VIEW.height);
  g.fill();
  g.strokeStyle = rgba(PALETTE.ridgeRim, 0.9);
  g.lineWidth = 1.5;
  g.beginPath();
  near.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
  // Pines along the ridge.
  for (let i = 0; i < 70; i += 1) {
    const x = rng.range(0, VIEW.width);
    if (x > 560 && x < 720) continue;
    const idx = Math.max(0, Math.min(near.length - 1, Math.round((x + 20) / 14)));
    const y = near[idx][1] + 4;
    const h = rng.range(12, 34);
    g.fillStyle = PALETTE.ridge;
    g.beginPath();
    g.moveTo(x, y - h);
    g.lineTo(x - h * 0.28, y);
    g.lineTo(x + h * 0.28, y);
    g.fill();
  }
  // The observatory on its rise: a domed tower with a lit slit.
  const ox = 640;
  const oy = near[Math.round((ox + 20) / 14)][1] + 2;
  g.fillStyle = PALETTE.ridge;
  g.fillRect(ox - 22, oy - 34, 44, 36);
  g.beginPath();
  g.arc(ox, oy - 34, 24, Math.PI, 0);
  g.fill();
  g.fillRect(ox - 40, oy - 12, 80, 14);
  g.strokeStyle = rgba(PALETTE.ridgeRim, 0.9);
  g.beginPath();
  g.arc(ox, oy - 34, 24, Math.PI, 0);
  g.stroke();
  g.save();
  g.translate(ox, oy - 40);
  g.rotate(-0.5);
  g.fillStyle = PALETTE.ridge;
  g.fillRect(-4, -34, 8, 30);
  g.restore();
  g.fillStyle = 'rgba(255,200,120,0.9)';
  g.fillRect(ox - 2, oy - 52, 4, 14);
  g.fillRect(ox - 12, oy - 22, 5, 7);
  g.fillRect(ox + 7, oy - 22, 5, 7);
}

export function createSky(seed = 7) {
  const rng = createRng(seed);
  const base = document.createElement('canvas');
  base.width = VIEW.width;
  base.height = VIEW.height;
  const g = base.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, VIEW.height);
  grad.addColorStop(0, PALETTE.skyTop);
  grad.addColorStop(0.55, PALETTE.skyMid);
  grad.addColorStop(1, PALETTE.skyLow);
  g.fillStyle = grad;
  g.fillRect(0, 0, VIEW.width, VIEW.height);
  paintNebula(g, rng);
  const stars = [];
  for (let i = 0; i < 260; i += 1) {
    stars.push({ x: rng.range(0, VIEW.width), y: rng.range(0, VIEW.horizon - 20), s: rng.next() ** 3 * 2 + 0.4, tw: rng.range(0.6, 3), ph: rng.next() * 6.28, hue: rng.pick(['#ffffff', '#cfe8ff', '#ffe6c4', '#d9ccff']) });
  }
  const ridge = document.createElement('canvas');
  ridge.width = VIEW.width;
  ridge.height = VIEW.height;
  paintRidge(ridge.getContext('2d'), rng);

  return {
    /** Paint the sky; dawn runs 0 (deep night) to 1 (sunrise). */
    draw(ctx, time, dawn = 0) {
      ctx.drawImage(base, 0, 0);
      if (dawn > 0) {
        const d = ctx.createLinearGradient(0, VIEW.height * 0.2, 0, VIEW.height);
        d.addColorStop(0, rgba('#ff9a6b', 0));
        d.addColorStop(0.7, rgba('#ff9a6b', 0.35 * dawn));
        d.addColorStop(1, rgba('#ffd28a', 0.85 * dawn));
        ctx.fillStyle = d;
        ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      }
      ctx.globalCompositeOperation = 'lighter';
      const hg = ctx.createLinearGradient(0, VIEW.horizon - 160, 0, VIEW.horizon);
      hg.addColorStop(0, rgba(PALETTE.horizonGlow, 0));
      hg.addColorStop(1, rgba(PALETTE.horizonGlow, 0.16 + 0.3 * dawn));
      ctx.fillStyle = hg;
      ctx.fillRect(0, VIEW.horizon - 160, VIEW.width, 160);
      if (dawn > 0.5) {
        // The sun lifts behind the observatory.
        const k = (dawn - 0.5) * 2;
        drawGlow(ctx, VIEW.width / 2, VIEW.horizon - 10, '#ffb05e', 420, 0.55 * k);
        drawGlow(ctx, VIEW.width / 2, VIEW.horizon - 10, '#fff0c0', 120, 0.8 * k);
        ctx.fillStyle = rgba('#fff3d6', 0.9 * k);
        ctx.beginPath();
        ctx.arc(VIEW.width / 2, VIEW.horizon - 4, 46, Math.PI, 0);
        ctx.fill();
      }
      const fade = 1 - dawn * 0.8;
      for (const s of stars) {
        const a = (0.45 + 0.55 * Math.sin(time * s.tw + s.ph) ** 2) * fade;
        ctx.globalAlpha = a;
        ctx.fillStyle = s.hue;
        ctx.fillRect(s.x - s.s / 2, s.y - s.s / 2, s.s, s.s);
        if (s.s > 1.6) drawGlow(ctx, s.x, s.y, '#bcd8ff', s.s * 4, a * 0.5);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },
    drawRidge(ctx) {
      ctx.drawImage(ridge, 0, 0);
    },
  };
}
