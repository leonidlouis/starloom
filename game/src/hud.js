// The heads-up display: the Weaver's light and stardust, the watch and its march toward dawn
// (or the Eclipse's life), score, harmony and best, the open loom's star slots with a hint of
// what a click will do, dash charge, boons held, and the big banner as each watch begins.
import { FONT_DISPLAY, FONT_UI, LOOM, PALETTE, VIEW, WATCH_COUNT } from './config.js';
import { WATCHES } from './waves.js';
import { BOONS } from './boons.js';
import { drawGlow, rgba } from './sprites.js';
import { drawGlyph } from './glyphs.js';

export function panel(ctx, x, y, w, h, r = 10, edge = PALETTE.panelEdge) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = PALETTE.panel;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function bar(ctx, x, y, w, h, frac, color, back = 'rgba(255,255,255,0.08)') {
  ctx.fillStyle = back;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  const fw = Math.max(0, Math.min(1, frac)) * w;
  if (fw > 1) {
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, rgba(color, 0.7));
    g.addColorStop(1, color);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x, y, fw, h, h / 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, x + fw, y + h / 2, color, h * 2.2, 0.7);
    ctx.globalCompositeOperation = 'source-over';
  }
}

function label(ctx, text, x, y, size = 12, color = PALETTE.muted, align = 'left', weight = 700, font = FONT_UI) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export function formatTime(s) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}

const ORDINAL = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Last'];

function drawVitals(ctx, world) {
  panel(ctx, 16, 14, 300, 86);
  const w = world.weaver;
  const low = w.light / world.stats.maxLight < 0.3;
  label(ctx, 'LIGHT', 32, 37, 11, low ? PALETTE.danger : PALETTE.light);
  label(ctx, `${Math.ceil(w.light)} / ${world.stats.maxLight}`, 300, 37, 12, PALETTE.text, 'right');
  bar(ctx, 32, 44, 268, 10, w.light / world.stats.maxLight, low ? PALETTE.danger : PALETTE.light);
  label(ctx, 'STARDUST', 32, 74, 11, PALETTE.dust);
  const afford = Math.floor(world.dust / world.stats.starCost);
  label(ctx, `${afford} star${afford === 1 ? '' : 's'} ready`, 300, 74, 12, PALETTE.text, 'right');
  bar(ctx, 32, 81, 268, 8, world.dust / LOOM.dustMax, PALETTE.silk);
  ctx.fillStyle = 'rgba(5,3,15,0.9)';
  for (let c = world.stats.starCost; c < LOOM.dustMax; c += world.stats.starCost) ctx.fillRect(32 + (c / LOOM.dustMax) * 268, 81, 1.5, 8);
}

function drawWatch(ctx, world) {
  const cx = VIEW.width / 2;
  const watch = WATCHES[world.watch];
  panel(ctx, cx - 190, 14, 380, 66);
  label(ctx, `${ORDINAL[world.watch].toUpperCase()} WATCH`, cx, 38, 20, PALETTE.text, 'center', 700, FONT_DISPLAY);
  label(ctx, `${world.watch + 1} / ${WATCH_COUNT}`, cx + 172, 36, 11, PALETTE.muted, 'right');
  for (let i = 0; i < WATCH_COUNT; i += 1) {
    ctx.fillStyle = i < world.watch ? PALETTE.dawn : i === world.watch ? PALETTE.silkHot : 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(cx - 172 + i * 11, 32, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  if (watch.boss && world.boss) {
    const b = world.boss;
    label(ctx, 'THE ECLIPSE', cx - 170, 66, 11, '#ff8fb0');
    bar(ctx, cx - 90, 58, 260, 10, b.hp / b.maxHp, '#ff5a8a');
  } else {
    const left = Math.max(0, watch.duration - world.watchTime);
    label(ctx, `DAWN IN ${formatTime(left)}`, cx - 170, 66, 11, PALETTE.dawn);
    bar(ctx, cx - 70, 59, 220, 8, world.watchTime / watch.duration, PALETTE.dawn);
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, cx + 162, 63, PALETTE.dawn, 12, 0.8);
    ctx.globalCompositeOperation = 'source-over';
  }
}

function drawScore(ctx, world, best) {
  const x = VIEW.width - 16;
  panel(ctx, x - 250, 14, 250, 86);
  label(ctx, 'SCORE', x - 234, 37, 11, PALETTE.muted);
  label(ctx, world.score.toLocaleString('en-US'), x - 16, 46, 30, PALETTE.silkHot, 'right', 700, FONT_DISPLAY);
  const h = world.harmony;
  label(ctx, `HARMONY ×${h}`, x - 234, 78, 12, h > 1 ? PALETTE.nova : PALETTE.muted);
  for (let i = 0; i < 8; i += 1) {
    ctx.fillStyle = i < h ? PALETTE.nova : 'rgba(255,255,255,0.12)';
    ctx.fillRect(x - 234 + i * 12, 84, 9, 4);
  }
  label(ctx, `BEST ${Math.max(best, world.score).toLocaleString('en-US')}`, x - 16, 78, 11, PALETTE.muted, 'right');
}

function drawLoomBar(ctx, world, hint) {
  const cx = VIEW.width / 2;
  const n = world.stats.maxStars;
  const open = world.loom.stars.length;
  const w = 70 + n * 30;
  panel(ctx, cx - w / 2 - 150, VIEW.height - 58, w + 300, 44);
  label(ctx, 'LOOM', cx - w / 2 - 134, VIEW.height - 31, 11, PALETTE.silk);
  for (let i = 0; i < n; i += 1) {
    const sx = cx - w / 2 - 70 + 56 + i * 30;
    const sy = VIEW.height - 36;
    const lit = i < open;
    if (lit) {
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, sx, sy, i === 0 ? '#ffe7a8' : PALETTE.star, 16, 0.9);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.fillStyle = lit ? '#ffffff' : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    for (let k = 0; k < 8; k += 1) {
      const r = k % 2 ? 2.6 : 7;
      const a = (k / 8) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r);
    }
    ctx.fill();
    if (i > 0) {
      ctx.strokeStyle = i < open ? rgba(PALETTE.silk, 0.9) : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx - 22, sy);
      ctx.lineTo(sx - 8, sy);
      ctx.stroke();
    }
  }
  label(ctx, hint, cx - w / 2 - 70 + 56 + n * 30 - 6, VIEW.height - 31, 12, open >= 3 ? PALETTE.silkHot : PALETTE.text, 'left', 600);
}

function drawKit(ctx, world) {
  const w = world.weaver;
  const y = VIEW.height - 58;
  panel(ctx, 16, y, 54, 44);
  const ready = w.dashCooldown <= 0;
  const frac = 1 - w.dashCooldown / world.stats.dashCooldown;
  ctx.strokeStyle = ready ? PALETTE.weaver : 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(43, y + 22, 14, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.stroke();
  label(ctx, 'DASH', 43, y + 26, 9, ready ? PALETTE.text : PALETTE.muted, 'center');
  let x = 16;
  for (const b of BOONS) {
    const lv = world.levels[b.id];
    if (!lv) continue;
    panel(ctx, x, 108, 34, 34, 7, rgba(PALETTE.silk, 0.25));
    drawGlyph(ctx, b.glyph, x + 17, 124, 10);
    if (lv > 1) label(ctx, `${lv}`, x + 31, 139, 10, PALETTE.silkHot, 'right');
    x += 38;
  }
  const count = world.shadows.length;
  panel(ctx, VIEW.width - 176, y, 160, 44);
  label(ctx, 'SHADOWS', VIEW.width - 160, y + 19, 10, PALETTE.muted);
  label(ctx, `${count}`, VIEW.width - 160, y + 37, 16, count > 40 ? PALETTE.danger : PALETTE.text, 'left', 800);
  label(ctx, 'BANISHED', VIEW.width - 88, y + 19, 10, PALETTE.muted);
  label(ctx, `${world.stats_.kills}`, VIEW.width - 88, y + 37, 16, PALETTE.text, 'left', 800);
}

function drawBanner(ctx, world) {
  if (world.banner <= 0) return;
  const k = Math.min(1, world.banner / 0.6, (3.2 - world.banner) / 0.4);
  const watch = WATCHES[world.watch];
  ctx.globalAlpha = Math.max(0, k);
  const cy = VIEW.height * 0.36;
  const g = ctx.createLinearGradient(0, cy - 60, 0, cy + 50);
  g.addColorStop(0, 'rgba(10,6,30,0)');
  g.addColorStop(0.5, 'rgba(10,6,30,0.6)');
  g.addColorStop(1, 'rgba(10,6,30,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, cy - 60, VIEW.width, 110);
  label(ctx, watch.title.toUpperCase(), VIEW.width / 2, cy, 46, PALETTE.silkHot, 'center', 700, FONT_DISPLAY);
  label(ctx, watch.omen, VIEW.width / 2, cy + 32, 18, PALETTE.text, 'center', 500, FONT_DISPLAY);
  ctx.globalAlpha = 1;
}

export function loomHint(world, aim) {
  const n = world.loom.stars.length;
  if (n === 0) return 'Click to pin the first star';
  if (n < 3) return 'Pin more stars: silk burns shadows';
  if (n >= world.stats.maxStars) return 'Full loom! Close now for a Grand nova';
  return 'SPACE / click first star: close for a nova';
}

export function drawHud(ctx, world, best, aim) {
  drawVitals(ctx, world);
  drawWatch(ctx, world);
  drawScore(ctx, world, best);
  drawLoomBar(ctx, world, loomHint(world, aim));
  drawKit(ctx, world);
  drawBanner(ctx, world);
}
