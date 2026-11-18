// The heads-up display. Top: the Weaver's light and stardust, the watch and its march toward
// dawn (or the Eclipse's life), score, harmony and best, and one plain line saying how to win
// and how to lose. Sides: the boons held, by name, and the shadows in the sky tonight with
// what comes next. Bottom: the open loom's star slots with what a click will do, dash charge,
// and a controls bar. Plus the big banner as each watch begins.
import { FONT_DISPLAY, FONT_UI, LOOM, PALETTE, SHADOWS, VIEW, WATCH_COUNT } from './config.js';
import { WATCHES } from './waves.js';
import { BOONS } from './boons.js';
import { drawGlow, rgba } from './sprites.js';
import { drawGlyph } from './glyphs.js';
import { drawShadow } from './render.js';

export function panel(ctx, x, y, w, h, r = 10, edge = PALETTE.panelEdge) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = PALETTE.panel;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function bar(ctx, x, y, w, h, frac, color, back = 'rgba(255,255,255,0.1)') {
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

function label(ctx, text, x, y, size = 12, color = PALETTE.muted, align = 'left', weight = 800, font = FONT_UI) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  return ctx.measureText(text).width;
}

export function formatTime(s) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}

const ORDINAL = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Last'];
const ROMAN = ['', 'I', 'II', 'III', 'IV'];

function drawVitals(ctx, world) {
  panel(ctx, 16, 14, 320, 100, 12);
  const w = world.weaver;
  const low = w.light / world.stats.maxLight < 0.3;
  label(ctx, 'LIGHT', 32, 42, 16, low ? PALETTE.danger : PALETTE.light);
  label(ctx, `${Math.ceil(w.light)} / ${world.stats.maxLight}`, 320, 42, 17, PALETTE.text, 'right');
  bar(ctx, 32, 50, 288, 13, w.light / world.stats.maxLight, low ? PALETTE.danger : PALETTE.light);
  label(ctx, 'STARDUST', 32, 88, 14, PALETTE.dust);
  const afford = Math.floor(world.dust / world.stats.starCost);
  label(ctx, `${afford} star${afford === 1 ? '' : 's'} ready`, 320, 88, 15, PALETTE.text, 'right');
  bar(ctx, 32, 95, 288, 9, world.dust / LOOM.dustMax, PALETTE.silk);
  ctx.fillStyle = 'rgba(5,3,15,0.9)';
  for (let c = world.stats.starCost; c < LOOM.dustMax; c += world.stats.starCost) ctx.fillRect(32 + (c / LOOM.dustMax) * 288, 95, 1.5, 9);
}

function drawWatch(ctx, world) {
  const cx = VIEW.width / 2;
  const watch = WATCHES[world.watch];
  panel(ctx, cx - 262, 14, 524, 84, 12);
  for (let i = 0; i < WATCH_COUNT; i += 1) {
    ctx.fillStyle = i < world.watch ? PALETTE.dawn : i === world.watch ? PALETTE.silkHot : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.arc(cx - 240 + i * 12, 38, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  label(ctx, `${ORDINAL[world.watch].toUpperCase()} WATCH`, cx, 47, 29, PALETTE.text, 'center', 700, FONT_DISPLAY);
  label(ctx, `${world.watch + 1} / ${WATCH_COUNT}`, cx + 244, 44, 16, PALETTE.muted, 'right');
  if (watch.boss && world.boss) {
    const b = world.boss;
    label(ctx, 'THE ECLIPSE', cx - 242, 83, 15, '#ff8fb0');
    bar(ctx, cx - 110, 72, 352, 13, b.hp / b.maxHp, '#ff5a8a');
  } else {
    const left = Math.max(0, watch.duration - world.watchTime);
    label(ctx, `DAWN IN ${formatTime(left)}`, cx - 242, 84, 15, PALETTE.dawn);
    bar(ctx, cx - 92, 73, 314, 10, world.watchTime / watch.duration, PALETTE.dawn);
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, cx + 234, 78, PALETTE.dawn, 14, 0.9);
    ctx.globalCompositeOperation = 'source-over';
  }
}

/** One plain line under the watch: how this night is won, and how it is lost. */
function drawObjective(ctx, world) {
  const cx = VIEW.width / 2;
  const watch = WATCHES[world.watch];
  const goal = watch.boss ? 'Wrap the Eclipse in constellations until it falls' : `Hold the sky until dawn: ${WATCH_COUNT} watches, then the Eclipse`;
  ctx.font = `800 17px ${FONT_UI}`;
  const gw = ctx.measureText(goal).width;
  const lose = 'your Light falls to 0';
  const lw = ctx.measureText(lose).width;
  const total = 56 + gw + 30 + 56 + lw;
  const x0 = cx - total / 2;
  ctx.beginPath();
  ctx.roundRect(x0 - 18, 102, total + 36, 34, 17);
  ctx.fillStyle = 'rgba(10,6,30,0.86)';
  ctx.fill();
  let x = x0;
  label(ctx, 'GOAL', x, 125, 15, PALETTE.dawn, 'left', 900);
  x += 56;
  label(ctx, goal, x, 125, 17, '#ffffff');
  x += gw + 30;
  label(ctx, 'LOSE', x, 125, 15, '#ff7a93', 'left', 900);
  x += 56;
  label(ctx, lose, x, 125, 17, '#ffffff');
}

function drawScore(ctx, world, best) {
  const x = VIEW.width - 16;
  panel(ctx, x - 270, 14, 270, 100, 12);
  label(ctx, 'SCORE', x - 254, 42, 15, PALETTE.muted);
  label(ctx, world.score.toLocaleString('en-US'), x - 16, 54, 40, PALETTE.silkHot, 'right', 700, FONT_DISPLAY);
  const h = world.harmony;
  label(ctx, `HARMONY ×${h}`, x - 254, 88, 16, h > 1 ? PALETTE.nova : PALETTE.muted);
  for (let i = 0; i < 8; i += 1) {
    ctx.fillStyle = i < h ? PALETTE.nova : 'rgba(255,255,255,0.14)';
    ctx.fillRect(x - 254 + i * 14, 96, 11, 5);
  }
  label(ctx, `BEST ${Math.max(best, world.score).toLocaleString('en-US')}`, x - 16, 98, 13, PALETTE.muted, 'right');
}

/** Boons held, each by glyph, name and level, down the left side. */
function drawBoonList(ctx, world) {
  const held = BOONS.filter((b) => world.levels[b.id]);
  if (!held.length) return;
  const h = 34 + held.length * 27;
  panel(ctx, 16, 124, 216, h, 12, rgba(PALETTE.silk, 0.3));
  label(ctx, 'BOONS', 30, 146, 13, PALETTE.silk, 'left', 900);
  held.forEach((b, i) => {
    const y = 170 + i * 27;
    drawGlyph(ctx, b.glyph, 40, y - 5, 8.5);
    label(ctx, b.name, 58, y, 15, PALETTE.text, 'left', 700);
    label(ctx, ROMAN[world.levels[b.id]], 218, y, 14, PALETTE.silkHot, 'right', 900);
  });
}

/** The shadows tonight's watch sends, with how many are in the sky, and what comes next. */
function drawThreats(ctx, world, t) {
  const watch = WATCHES[world.watch];
  const kinds = [...new Set([...(watch.boss ? [watch.boss] : []), ...watch.spawns.map(([type]) => type)])];
  const alive = {};
  for (const s of world.shadows) alive[s.type] = (alive[s.type] ?? 0) + 1;
  const next = WATCHES[world.watch + 1];
  const h = 36 + kinds.length * 30 + (next ? 40 : 0);
  const x = VIEW.width - 236;
  panel(ctx, x, 124, 220, h, 12);
  label(ctx, 'IN THE SKY', x + 14, 146, 13, PALETTE.danger, 'left', 900);
  kinds.forEach((type, i) => {
    const y = 172 + i * 30;
    const r = type === 'eclipse' ? 7 : Math.min(SHADOWS[type].r, 13) * 0.85;
    drawShadow(ctx, { type, x: x + 28, y: y - 5, r, vx: 1, vy: 0.1, seed: i * 2, flash: 0, slow: 0, cooldown: 1, hp: 1, maxHp: 1 }, t + i);
    label(ctx, SHADOWS[type].name, x + 50, y, 15, PALETTE.text, 'left', 700);
    label(ctx, `${alive[type] ?? 0}`, x + 206, y, 15, alive[type] ? PALETTE.silkHot : PALETTE.muted, 'right', 900);
  });
  if (next) {
    const y = 160 + kinds.length * 30;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x + 14, y, 192, 1);
    label(ctx, `NEXT: ${next.title.toUpperCase()}`, x + 14, y + 26, 13, PALETTE.muted, 'left', 900);
  }
}

function drawLoomBar(ctx, world, hint) {
  const cx = VIEW.width / 2;
  const n = world.stats.maxStars;
  const open = world.loom.stars.length;
  ctx.font = `800 16px ${FONT_UI}`;
  const hw = ctx.measureText(hint).width;
  const slots = n * 30;
  const w = 90 + slots + 24 + hw + 24;
  const x0 = cx - w / 2;
  const y = VIEW.height - 104;
  panel(ctx, x0, y, w, 50, 14, rgba(PALETTE.silk, 0.45));
  label(ctx, 'LOOM', x0 + 18, y + 31, 15, PALETTE.silk, 'left', 900);
  for (let i = 0; i < n; i += 1) {
    const sx = x0 + 86 + i * 30;
    const sy = y + 25;
    const lit = i < open;
    if (lit) {
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, sx, sy, i === 0 ? '#ffe7a8' : PALETTE.star, 18, 0.9);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.fillStyle = lit ? '#ffffff' : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    for (let k = 0; k < 8; k += 1) {
      const r = k % 2 ? 3 : 8;
      const a = (k / 8) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r);
    }
    ctx.fill();
    if (i > 0) {
      ctx.strokeStyle = i < open ? rgba(PALETTE.silk, 0.9) : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx - 21, sy);
      ctx.lineTo(sx - 9, sy);
      ctx.stroke();
    }
  }
  label(ctx, hint, x0 + 86 + slots + 8, y + 31, 16, open >= 3 ? PALETTE.silkHot : PALETTE.text, 'left', 800);
}

function drawKit(ctx, world) {
  const w = world.weaver;
  const y = VIEW.height - 104;
  panel(ctx, 16, y, 60, 50, 14);
  const ready = w.dashCooldown <= 0;
  const frac = 1 - w.dashCooldown / world.stats.dashCooldown;
  ctx.strokeStyle = ready ? PALETTE.weaver : 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(46, y + 25, 17, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.stroke();
  label(ctx, 'DASH', 46, y + 29, 10, ready ? PALETTE.text : PALETTE.muted, 'center', 900);
  const count = world.shadows.length;
  panel(ctx, VIEW.width - 196, y, 180, 50, 14);
  label(ctx, 'SHADOWS', VIEW.width - 180, y + 20, 11, PALETTE.muted, 'left', 900);
  label(ctx, `${count}`, VIEW.width - 180, y + 42, 19, count > 40 ? PALETTE.danger : PALETTE.text, 'left', 900);
  label(ctx, 'BANISHED', VIEW.width - 100, y + 20, 11, PALETTE.muted, 'left', 900);
  label(ctx, `${world.stats_.kills}`, VIEW.width - 100, y + 42, 19, PALETTE.text, 'left', 900);
}

const CONTROLS = [
  ['WASD', 'fly'],
  ['CLICK', 'pin a star'],
  ['CLICK FIRST STAR / SPACE', 'close: nova'],
  ['SHIFT', 'dash'],
  ['RIGHT-CLICK', 'unravel'],
  ['ESC', 'pause'],
];

/** A slim bar of key caps along the bottom edge. */
function drawControls(ctx) {
  const y = VIEW.height - 30;
  ctx.font = `900 12px ${FONT_UI}`;
  const parts = CONTROLS.map(([k, a]) => {
    ctx.font = `900 12px ${FONT_UI}`;
    const kw = ctx.measureText(k).width + 14;
    ctx.font = `600 14px ${FONT_UI}`;
    return { k, a, kw, aw: ctx.measureText(a).width };
  });
  const total = parts.reduce((s, p) => s + p.kw + 7 + p.aw + 22, -22);
  let x = VIEW.width / 2 - total / 2;
  ctx.fillStyle = 'rgba(6,3,18,0.72)';
  ctx.beginPath();
  ctx.roundRect(x - 16, y - 4, total + 32, 28, 14);
  ctx.fill();
  for (const p of parts) {
    ctx.beginPath();
    ctx.roundRect(x, y + 1, p.kw, 19, 5);
    ctx.fillStyle = 'rgba(255,215,122,0.16)';
    ctx.fill();
    label(ctx, p.k, x + p.kw / 2, y + 15, 12, PALETTE.silkHot, 'center', 900);
    label(ctx, p.a, x + p.kw + 7, y + 16, 14, PALETTE.text, 'left', 600);
    x += p.kw + 7 + p.aw + 22;
  }
}

function drawBanner(ctx, world) {
  if (world.banner <= 0) return;
  const k = Math.min(1, world.banner / 0.6, (3.2 - world.banner) / 0.4);
  const watch = WATCHES[world.watch];
  ctx.globalAlpha = Math.max(0, k);
  const cy = VIEW.height * 0.38;
  const g = ctx.createLinearGradient(0, cy - 70, 0, cy + 60);
  g.addColorStop(0, 'rgba(10,6,30,0)');
  g.addColorStop(0.5, 'rgba(10,6,30,0.65)');
  g.addColorStop(1, 'rgba(10,6,30,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, cy - 70, VIEW.width, 130);
  label(ctx, watch.title.toUpperCase(), VIEW.width / 2, cy, 54, PALETTE.silkHot, 'center', 700, FONT_DISPLAY);
  label(ctx, watch.omen, VIEW.width / 2, cy + 36, 22, PALETTE.text, 'center', 500, FONT_DISPLAY);
  ctx.globalAlpha = 1;
}

export function loomHint(world) {
  const n = world.loom.stars.length;
  if (n === 0) return 'Click to pin the first star';
  if (n < 3) return 'Pin more stars: silk burns shadows';
  if (n >= world.stats.maxStars) return 'Full loom! Close now for a Grand nova';
  return 'Click the first star or SPACE: nova!';
}

export function drawHud(ctx, world, best, t = 0) {
  drawVitals(ctx, world);
  drawWatch(ctx, world);
  drawObjective(ctx, world);
  drawScore(ctx, world, best);
  drawBoonList(ctx, world);
  drawThreats(ctx, world, t);
  drawLoomBar(ctx, world, loomHint(world));
  drawKit(ctx, world);
  drawControls(ctx);
  drawBanner(ctx, world);
}
