// Paints the night in play: past constellations, burning shapes, the open chain of stars and its
// silk, stardust, the shadows (one look per kind), orbs, bolts, the Weaver and all the sparks.
import { PALETTE } from './config.js';
import { centroid } from './geometry.js';
import { canClose, placeBlocker } from './loom.js';
import { drawGlow, rgba } from './sprites.js';

function blobPath(ctx, x, y, r, t, seed, lumps = 7, amp = 0.12) {
  ctx.beginPath();
  const n = 22;
  for (let i = 0; i <= n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + amp * Math.sin(a * lumps + t * 3 + seed) + amp * 0.6 * Math.sin(a * 3 - t * 2 + seed * 2);
    const px = x + Math.cos(a) * r * k;
    const py = y + Math.sin(a) * r * k;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function eyes(ctx, x, y, r, count, look, color = PALETTE.eye, size = 0.16) {
  const spread = r * 0.42;
  for (let i = 0; i < count; i += 1) {
    const off = count === 1 ? 0 : (i / (count - 1) - 0.5) * 2 * spread;
    const ex = x + off + Math.cos(look) * r * 0.18;
    const ey = y - r * 0.12 + Math.sin(look) * r * 0.14 + (count === 3 && i === 1 ? -r * 0.18 : 0);
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, ex, ey, color, r * 0.55, 0.9);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ffe1ea';
    ctx.beginPath();
    ctx.ellipse(ex, ey, Math.max(1.4, r * size), Math.max(1.1, r * size * 0.75), 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Draw one shadow; also used for the bestiary on the title screen. */
export function drawShadow(ctx, s, t) {
  const { x, y, r } = s;
  const look = Math.atan2(s.vy || 1, s.vx || 0);
  ctx.save();
  // Dark aura so ink reads against the sky.
  const aura = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 2.1);
  aura.addColorStop(0, 'rgba(8,2,18,0.7)');
  aura.addColorStop(1, 'rgba(8,2,18,0)');
  ctx.fillStyle = aura;
  ctx.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
  const body = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.strokeStyle = rgba(s.type === 'gnawer' ? '#c8475d' : PALETTE.inkRim, 0.95);
  ctx.fillStyle = body;
  switch (s.type) {
    case 'wisp': {
      ctx.beginPath();
      const tx = x - Math.cos(look) * r * 2.4;
      const ty = y - Math.sin(look) * r * 2.4 + Math.sin(t * 8 + s.seed) * 3;
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(x - Math.sin(look) * r * 1.2, y + Math.cos(look) * r * 1.2, x + Math.cos(look) * r, y + Math.sin(look) * r);
      ctx.quadraticCurveTo(x + Math.sin(look) * r * 1.2, y - Math.cos(look) * r * 1.2, tx, ty);
      ctx.fill();
      ctx.stroke();
      blobPath(ctx, x, y, r, t, s.seed, 5, 0.08);
      ctx.fill();
      eyes(ctx, x, y, r, 2, look, PALETTE.eye, 0.13);
      break;
    }
    case 'flitter': {
      const flap = Math.sin(t * 22 + s.seed) * 0.6;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + side * r * 2.4, y - r * (1.6 + flap), x + side * r * 2.2, y + r * 0.4);
        ctx.quadraticCurveTo(x + side * r * 1.2, y + r * 1.2, x, y + r * 0.3);
        ctx.fill();
        ctx.stroke();
      }
      blobPath(ctx, x, y, r * 0.8, t, s.seed, 4, 0.06);
      ctx.fill();
      ctx.stroke();
      eyes(ctx, x, y, r * 0.9, 2, look, '#ff8a3d', 0.14);
      break;
    }
    case 'gnawer': {
      blobPath(ctx, x, y, r, t * 1.6, s.seed, 9, 0.16);
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(look);
      ctx.fillStyle = '#ffd2dc';
      const open = 0.35 + 0.25 * Math.sin(t * 14 + s.seed);
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.moveTo(r * 0.55, i * r * 0.18 - r * 0.05);
        ctx.lineTo(r * (0.95 + open * 0.2), i * r * 0.18);
        ctx.lineTo(r * 0.55, i * r * 0.18 + r * 0.08);
        ctx.fill();
      }
      ctx.restore();
      eyes(ctx, x - Math.cos(look) * r * 0.2, y - Math.sin(look) * r * 0.2, r, 2, look, '#ff2e4d', 0.12);
      break;
    }
    case 'hulk': {
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x + side * r * 0.5, y - r * 0.7);
        ctx.quadraticCurveTo(x + side * r * 1.2, y - r * 1.4, x + side * r * 0.9, y - r * 1.75);
        ctx.quadraticCurveTo(x + side * r * 0.85, y - r * 1.2, x + side * r * 0.15, y - r * 0.85);
        ctx.fill();
        ctx.stroke();
      }
      blobPath(ctx, x, y, r, t * 0.6, s.seed, 6, 0.1);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = rgba('#ff5a7a', 0.55);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.5, y + r * 0.2);
      ctx.lineTo(x - r * 0.15, y + r * 0.45);
      ctx.lineTo(x + r * 0.3, y + r * 0.25);
      ctx.lineTo(x + r * 0.55, y + r * 0.5);
      ctx.stroke();
      eyes(ctx, x, y, r, 3, look, PALETTE.eye, 0.1);
      break;
    }
    case 'lurker': {
      ctx.lineWidth = 2.4;
      for (let i = 0; i < 6; i += 1) {
        const a = Math.PI * 0.15 + (i / 5) * Math.PI * 0.7;
        const wave = Math.sin(t * 5 + i + s.seed) * 6;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6);
        ctx.quadraticCurveTo(x + Math.cos(a) * r * 1.5 + wave, y + Math.sin(a) * r * 1.5, x + Math.cos(a) * r * 2.1 - wave, y + Math.sin(a) * r * 2.2);
        ctx.stroke();
      }
      blobPath(ctx, x, y, r, t, s.seed, 5, 0.08);
      ctx.fill();
      ctx.stroke();
      const charge = s.cooldown !== undefined ? Math.max(0, 1 - s.cooldown / 0.8) : 0;
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, x, y - r * 0.1, PALETTE.orb, r * (1 + charge), 0.8 + charge * 0.4);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#f6d9ff';
      ctx.beginPath();
      ctx.arc(x + Math.cos(look) * r * 0.2, y - r * 0.1 + Math.sin(look) * r * 0.15, r * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16051f';
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(look) * r * 0.28, y - r * 0.1 + Math.sin(look) * r * 0.2, r * 0.07, r * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'mire': {
      blobPath(ctx, x, y, r, t * 1.2, s.seed, 5, 0.14);
      ctx.fill();
      ctx.stroke();
      for (let i = 0; i < 3; i += 1) {
        const a = t * 1.5 + (i / 3) * Math.PI * 2 + s.seed;
        const bx = x + Math.cos(a) * r * 1.15;
        const by = y + Math.sin(a) * r * 1.15;
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(bx, by, r * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, bx, by, '#9dff6a', r * 0.3, 0.6);
        ctx.globalCompositeOperation = 'source-over';
      }
      eyes(ctx, x, y, r, 2, look, '#9dff6a', 0.12);
      break;
    }
    case 'eclipse':
      drawEclipse(ctx, s, t);
      break;
    default:
      break;
  }
  if (s.type !== 'eclipse') {
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, x, y, '#7a2a9a', r * 2.2, 0.35);
    ctx.globalCompositeOperation = 'source-over';
  }
  if (s.flash > 0 && s.type !== 'eclipse') {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255,236,214,${0.5 * s.flash})`;
    blobPath(ctx, x, y, r * 1.05, t, s.seed, 6, 0.1);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  if (s.slow > 0.05 && s.type !== 'eclipse') {
    ctx.strokeStyle = rgba(PALETTE.silk, 0.5 * s.slow);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.35, t * 4, t * 4 + Math.PI * 1.2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEclipse(ctx, s, t) {
  const { x, y, r } = s;
  const enraged = s.hp < s.maxHp * 0.5;
  ctx.globalCompositeOperation = 'lighter';
  drawGlow(ctx, x, y, enraged ? '#ff4a3d' : '#ff7a3d', r * 3.4, 0.55);
  drawGlow(ctx, x, y, '#c23bff', r * 2.4, 0.5);
  // Corona rays.
  for (let i = 0; i < 48; i += 1) {
    const a = (i / 48) * Math.PI * 2 + t * 0.15;
    const len = r * (1.25 + 0.35 * Math.sin(t * 3 + i * 1.7) + (i % 3 === 0 ? 0.35 : 0));
    ctx.strokeStyle = i % 2 ? 'rgba(255,150,80,0.5)' : 'rgba(255,90,170,0.45)';
    ctx.lineWidth = i % 3 === 0 ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.98, y + Math.sin(a) * r * 0.98);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,214,150,0.95)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.02, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#030108';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // Orbiting shards.
  for (let i = 0; i < 6; i += 1) {
    const a = t * 0.8 + (i / 6) * Math.PI * 2;
    const sx = x + Math.cos(a) * r * 1.7;
    const sy = y + Math.sin(a) * r * 1.7;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(a * 2);
    ctx.fillStyle = '#0a0414';
    ctx.strokeStyle = 'rgba(255,120,190,0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  // The eye.
  const look = Math.sin(t * 0.7) * 0.6;
  const blink = Math.max(0.15, Math.abs(Math.sin(t * 0.5)) ** 0.2);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.62, r * 0.36 * blink, 0, 0, Math.PI * 2);
  ctx.clip();
  const iris = ctx.createRadialGradient(x + look * 10, y, 2, x + look * 10, y, r * 0.5);
  iris.addColorStop(0, '#fff6d8');
  iris.addColorStop(0.25, enraged ? '#ff4141' : '#ff9d3d');
  iris.addColorStop(0.6, '#a0105a');
  iris.addColorStop(1, '#25021a');
  ctx.fillStyle = iris;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.fillStyle = '#050008';
  ctx.beginPath();
  ctx.ellipse(x + look * 14, y, r * 0.07, r * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (s.flash > 0) {
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, x, y, '#ffffff', r * 1.3, s.flash * 0.7);
    ctx.globalCompositeOperation = 'source-over';
  }
}

function drawStar(ctx, x, y, t, size = 1, color = PALETTE.star, pulse = 0) {
  ctx.globalCompositeOperation = 'lighter';
  drawGlow(ctx, x, y, color, 30 * size + pulse * 14, 0.85);
  ctx.strokeStyle = rgba('#ffffff', 0.85);
  ctx.lineWidth = 1.4;
  const L = (11 + Math.sin(t * 5) * 1.5) * size;
  ctx.beginPath();
  ctx.moveTo(x - L, y);
  ctx.lineTo(x + L, y);
  ctx.moveTo(x, y - L * 1.3);
  ctx.lineTo(x, y + L * 1.3);
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = PALETTE.starCore;
  ctx.beginPath();
  ctx.arc(x, y, 3.2 * size, 0, Math.PI * 2);
  ctx.fill();
}

function silkLine(ctx, ax, ay, bx, by, t, strain = 0, alpha = 1) {
  const jitter = strain > 0 ? 3 : 0;
  const mx = (ax + bx) / 2 + (jitter ? Math.sin(t * 60) * jitter : 0);
  const my = (ay + by) / 2 + (jitter ? Math.cos(t * 55) * jitter : 0);
  ctx.globalCompositeOperation = 'lighter';
  const passes = [
    [14, 0.07],
    [7, 0.16],
  ];
  const hue = strain > 0 ? '#ff5a4a' : '#ff9f2e';
  for (const [w, a] of passes) {
    ctx.strokeStyle = rgba(hue, a * alpha);
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(mx, my, bx, by);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = rgba(strain > 0 ? '#ff7a5a' : PALETTE.silk, 0.95 * alpha);
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.strokeStyle = rgba(PALETTE.silkHot, 0.9 * alpha);
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.globalCompositeOperation = 'lighter';
  // Sparks travelling along the thread.
  const len = Math.hypot(bx - ax, by - ay);
  const count = Math.max(1, Math.floor(len / 70));
  for (let i = 0; i < count; i += 1) {
    const u = (t * 0.6 + i / count) % 1;
    drawGlow(ctx, ax + (bx - ax) * u, ay + (by - ay) * u, PALETTE.silkHot, 9, 0.9 * alpha);
  }
  ctx.globalCompositeOperation = 'source-over';
}

function drawSigns(ctx, loom, t, bright = false) {
  for (const sg of loom.signs) {
    const settle = Math.min(1, sg.age / 2.5);
    const fade = bright ? 1 : Math.max(0, 1 - Math.max(0, sg.age - 16) / 8);
    if (fade <= 0) continue;
    const a = (bright ? 0.6 : 0.55 - 0.33 * settle) * fade;
    if (bright) {
      // At dawn the night's constellations hang in the sky as a woven tapestry.
      sg.pts.forEach((p, i) => {
        const q = sg.pts[(i + 1) % sg.pts.length];
        silkLine(ctx, p.x, p.y, q.x, q.y, t + i, 0, 0.75);
      });
      sg.pts.forEach((p, i) => drawStar(ctx, p.x, p.y, t + i, 0.6));
      const c = centroid(sg.pts);
      ctx.fillStyle = 'rgba(255,240,220,0.8)';
      ctx.font = 'italic 600 16px "Cormorant Garamond", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(sg.name, c.x, c.y + 5);
      continue;
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba('#bfe3ff', a);
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    sg.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    for (const p of sg.pts) drawGlow(ctx, p.x, p.y, '#cfe8ff', 10, a + 0.25);
    ctx.globalCompositeOperation = 'source-over';
    const c = centroid(sg.pts);
    ctx.fillStyle = rgba('#d8e6ff', a + 0.1);
    ctx.font = 'italic 15px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(sg.name, c.x, c.y + 5);
  }
}

function drawFields(ctx, loom, t) {
  for (const f of loom.fields) {
    const c = centroid(f.pts);
    const reach = Math.max(...f.pts.map((p) => Math.hypot(p.x - c.x, p.y - c.y)));
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, reach);
    const a = (0.16 + 0.05 * Math.sin(t * 12)) * Math.min(1, f.life);
    g.addColorStop(0, rgba('#ffd27a', a * 1.4));
    g.addColorStop(1, rgba('#ff8a3d', a * 0.6));
    ctx.fillStyle = g;
    ctx.beginPath();
    f.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < f.pts.length; i += 1) {
      const p = f.pts[i];
      const q = f.pts[(i + 1) % f.pts.length];
      silkLine(ctx, p.x, p.y, q.x, q.y, t + i, 0, Math.min(1, f.life) * 0.7);
    }
  }
}

function drawChain(ctx, world, aim, t, showGuide) {
  const stars = world.loom.stars;
  for (let i = 1; i < stars.length; i += 1) silkLine(ctx, stars[i - 1].x, stars[i - 1].y, stars[i].x, stars[i].y, t + i * 0.37, stars[i].strain || 0);
  const last = stars[stars.length - 1];
  if (showGuide && aim) {
    const closing = canClose(world, aim.x, aim.y);
    const ok = !placeBlocker(world, aim.x, aim.y) || closing;
    if (last) {
      ctx.setLineDash([6, 8]);
      ctx.lineDashOffset = -t * 30;
      ctx.strokeStyle = ok ? rgba(PALETTE.silk, 0.55) : rgba(PALETTE.danger, 0.4);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(closing ? stars[0].x : aim.x, closing ? stars[0].y : aim.y);
      ctx.stroke();
      if (stars.length >= 2 && !closing) {
        ctx.strokeStyle = rgba(PALETTE.silk, 0.2);
        ctx.beginPath();
        ctx.moveTo(aim.x, aim.y);
        ctx.lineTo(stars[0].x, stars[0].y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    if (!closing) {
      ctx.strokeStyle = ok ? rgba(PALETTE.star, 0.8) : rgba(PALETTE.danger, 0.7);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(aim.x, aim.y, 9, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  stars.forEach((s, i) => {
    const closable = i === 0 && stars.length >= 3;
    const grow = Math.min(1, s.age * 6);
    drawStar(ctx, s.x, s.y, t + i, 0.6 + 0.4 * grow + (closable ? 0.15 : 0), i === 0 ? '#ffe7a8' : PALETTE.star, closable ? 0.5 + 0.5 * Math.sin(t * 6) : 0);
    if (closable) {
      ctx.strokeStyle = rgba(PALETTE.silkHot, 0.5 + 0.4 * Math.sin(t * 6));
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 22 + 4 * Math.sin(t * 6), 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

function drawWeaver(ctx, world, t) {
  const w = world.weaver;
  ctx.globalCompositeOperation = 'lighter';
  w.trail.forEach((p, i) => {
    const k = 1 - i / w.trail.length;
    drawGlow(ctx, p.x, p.y, PALETTE.weaver, 16 * k + 4, 0.35 * k);
  });
  const blink = w.grace > 0 && Math.floor(t * 20) % 2 === 0 ? 0.4 : 1;
  drawGlow(ctx, w.x, w.y, PALETTE.weaver, 46, 0.7 * blink);
  drawGlow(ctx, w.x, w.y, '#ffffff', 14, 0.9 * blink);
  ctx.globalCompositeOperation = 'source-over';
  // A small loom-spindle body: a diamond with orbiting threads.
  ctx.save();
  ctx.translate(w.x, w.y);
  ctx.rotate(w.facing + Math.PI / 2);
  ctx.fillStyle = '#e9fdff';
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(6, 0);
  ctx.lineTo(0, 9);
  ctx.lineTo(-6, 0);
  ctx.closePath();
  ctx.globalAlpha = blink;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = rgba(PALETTE.silk, 0.8 * blink);
  ctx.lineWidth = 1.3;
  for (let i = 0; i < 2; i += 1) {
    ctx.beginPath();
    ctx.ellipse(w.x, w.y, 17, 6, t * 2 + i * Math.PI * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawReach(ctx, world, t) {
  const w = world.weaver;
  ctx.strokeStyle = rgba(PALETTE.star, 0.16);
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 9]);
  ctx.lineDashOffset = t * 8;
  ctx.beginPath();
  ctx.arc(w.x, w.y, world.stats.reach, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawEffects(ctx, fx) {
  ctx.globalCompositeOperation = 'lighter';
  for (const b of fx.beams) {
    const k = b.life / b.max;
    ctx.fillStyle = rgba('#ffb347', 0.3 * k * k);
    ctx.beginPath();
    b.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#ff9f2e', 0.5 * k);
    ctx.lineWidth = 10 * k + 2;
    ctx.stroke();
    ctx.strokeStyle = rgba('#ffe3a0', k);
    ctx.lineWidth = 2 + 2 * k;
    ctx.stroke();
    for (const p of b.pts) {
      drawGlow(ctx, p.x, p.y, '#ffd77a', 40 + 50 * k, k);
      drawGlow(ctx, p.x, p.y, '#ffffff', 10 + 10 * k, k);
    }
  }
  for (const r of fx.rings) {
    const k = 1 - r.life / r.max;
    ctx.strokeStyle = rgba(r.color, (1 - k) * 0.9);
    ctx.lineWidth = r.width * (1 - k) + 0.5;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.from + (r.to - r.from) * (1 - (1 - k) ** 3), 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const p of fx.particles) {
    const k = p.life / p.max;
    if (p.color === PALETTE.ink) continue;
    drawGlow(ctx, p.x, p.y, p.color, p.size * 3.2, k);
  }
  ctx.globalCompositeOperation = 'source-over';
  for (const p of fx.particles) {
    if (p.color !== PALETTE.ink) continue;
    ctx.globalAlpha = p.life / p.max;
    ctx.fillStyle = '#12061f';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPopups(ctx, fx) {
  ctx.textAlign = 'center';
  for (const p of fx.popups) {
    const k = p.life / p.max;
    const pop = 1 + 0.25 * Math.max(0, (k - 0.85) / 0.15);
    ctx.globalAlpha = Math.min(1, k * 2.5);
    ctx.font = `700 ${Math.round(p.size * pop)}px "Cormorant Garamond", Georgia, serif`;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(8,3,20,0.8)';
    ctx.strokeText(p.text, p.x, p.y);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;
  if (fx.denied) {
    const d = fx.denied;
    ctx.globalAlpha = Math.min(1, d.life * 2);
    ctx.font = '600 13px "Mulish", system-ui, sans-serif';
    ctx.fillStyle = PALETTE.danger;
    ctx.fillText(d.text, d.x, d.y - 18);
    ctx.globalAlpha = 1;
  }
}

/** Paint everything that lives in the sky this frame (not the HUD). */
export function drawWorld(ctx, world, t, aim, showGuide = true) {
  drawSigns(ctx, world.loom, t, world.phase === 'victory');
  drawFields(ctx, world.loom, t);
  if (world.phase === 'watch') drawReach(ctx, world, t);
  drawChain(ctx, world, aim, t, showGuide && world.phase === 'watch');
  ctx.globalCompositeOperation = 'lighter';
  for (const m of world.motes) drawGlow(ctx, m.x, m.y, PALETTE.dust, 7, 0.9);
  ctx.globalCompositeOperation = 'source-over';
  const sorted = world.shadows.slice().sort((a, b) => a.r - b.r);
  for (const s of sorted) drawShadow(ctx, s, t + s.seed);
  ctx.globalCompositeOperation = 'lighter';
  for (const o of world.orbs) {
    drawGlow(ctx, o.x, o.y, PALETTE.orb, o.r * 3.2, 0.95);
    drawGlow(ctx, o.x, o.y, '#ffb3ff', o.r * 1.1, 0.8);
  }
  for (const b of world.bolts) {
    ctx.strokeStyle = rgba(PALETTE.bolt, 0.9);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - b.vx * 0.025, b.y - b.vy * 0.025);
    ctx.stroke();
    drawGlow(ctx, b.x, b.y, PALETTE.bolt, 10, 0.9);
  }
  ctx.globalCompositeOperation = 'source-over';
  for (const o of world.orbs) {
    ctx.fillStyle = '#16021f';
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  if (world.phase !== 'defeat' && world.phase !== 'victory') drawWeaver(ctx, world, t);
  drawEffects(ctx, world.fx);
  drawPopups(ctx, world.fx);
}

export { drawStar, silkLine };
