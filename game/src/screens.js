// The menus and full screens: title with how-to-play and the bestiary, pause, settings with
// volume sliders, the boon choice after each watch, and the dawn (victory) and darkness (defeat)
// result screens with the run's stats and a restart. Each registers its buttons for the mouse.
import { FONT_DISPLAY, FONT_UI, PALETTE, SHADOWS, VIEW, WATCH_COUNT } from './config.js';
import { BOONS, boonById } from './boons.js';
import { WATCHES } from './waves.js';
import { panel, formatTime } from './hud.js';
import { drawGlyph } from './glyphs.js';
import { drawShadow, drawStar, silkLine } from './render.js';
import { drawGlow, rgba } from './sprites.js';

export function text(ctx, str, x, y, size, color = PALETTE.text, align = 'left', weight = 600, font = FONT_UI) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export function wrap(ctx, str, x, y, maxW, lh, size, color = PALETTE.text, weight = 500, align = 'left') {
  ctx.font = `${weight} ${size}px ${FONT_UI}`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  let line = '';
  for (const word of str.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      y += lh;
      line = word;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y);
  return y + lh;
}

export function button(ctx, ui, id, x, y, w, h, label, key, primary = false) {
  const hover = ui.mouse.x >= x && ui.mouse.x <= x + w && ui.mouse.y >= y && ui.mouse.y <= y + h;
  ui.buttons.push({ id, x, y, w, h });
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  if (primary) {
    g.addColorStop(0, hover ? '#ffe7a8' : '#ffd77a');
    g.addColorStop(1, hover ? '#ffbf5e' : '#e0a84a');
  } else {
    g.addColorStop(0, hover ? 'rgba(80,60,140,0.95)' : 'rgba(40,28,84,0.9)');
    g.addColorStop(1, hover ? 'rgba(60,40,110,0.95)' : 'rgba(24,16,56,0.9)');
  }
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = primary ? '#fff3c9' : rgba(PALETTE.silk, hover ? 0.8 : 0.4);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  if (primary) {
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, x + w / 2, y + h / 2, PALETTE.silk, w * 0.6, hover ? 0.35 : 0.2);
    ctx.globalCompositeOperation = 'source-over';
  }
  text(ctx, label, x + w / 2 - (key ? 14 : 0), y + h / 2 + 6, h >= 50 ? 19 : 16, primary ? '#2a1238' : PALETTE.text, 'center', 800);
  if (key) text(ctx, key, x + w - 18, y + h / 2 + 5, 11, primary ? 'rgba(42,18,56,0.7)' : PALETTE.muted, 'right', 800);
}

function dim(ctx, a = 0.6) {
  ctx.fillStyle = `rgba(6,3,18,${a})`;
  // Menus may sit on a dropped card (see main.js): cover the whole sky either way.
  ctx.fillRect(0, -VIEW.height, VIEW.width, VIEW.height * 3);
}

function logo(ctx, x, y, size, t) {
  ctx.save();
  ctx.font = `700 ${size}px ${FONT_DISPLAY}`;
  ctx.textAlign = 'center';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(size * 0.12)}px`;
  ctx.globalCompositeOperation = 'lighter';
  drawGlow(ctx, x, y - size * 0.3, PALETTE.silk, size * 3.2, 0.22);
  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowColor = 'rgba(255,200,110,0.8)';
  ctx.shadowBlur = 28;
  const g = ctx.createLinearGradient(0, y - size, 0, y);
  g.addColorStop(0, '#fff7de');
  g.addColorStop(0.55, '#ffd77a');
  g.addColorStop(1, '#e98a4a');
  ctx.fillStyle = g;
  ctx.fillText('STARLOOM', x, y);
  ctx.restore();
  // A thread of silk underlines the title, pinned by three stars.
  const w = size * 3.4;
  silkLine(ctx, x - w / 2, y + 22, x + w / 2, y + 22, t, 0, 0.8);
  drawStar(ctx, x - w / 2, y + 22, t, 0.7);
  drawStar(ctx, x, y + 22, t + 1, 0.9, '#ffe7a8');
  drawStar(ctx, x + w / 2, y + 22, t + 2, 0.7);
}

/** Small diagrams for the how-to-play steps. */
function stepArt(ctx, kind, x, y, t) {
  if (kind === 0) {
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, x, y, PALETTE.weaver, 26, 0.8);
    drawGlow(ctx, x, y, '#ffffff', 8, 1);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = rgba(PALETTE.star, 0.35);
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (kind === 1) {
    silkLine(ctx, x - 24, y + 10, x + 24, y - 10, t);
    drawStar(ctx, x - 24, y + 10, t, 0.6);
    drawStar(ctx, x + 24, y - 10, t, 0.6);
    drawShadow(ctx, { type: 'wisp', x: x + 2, y: y + 2, r: 8, vx: 0, vy: 1, seed: 1, flash: 0.4, slow: 0.6 }, t);
  } else if (kind === 2) {
    const pts = [[-26, 12], [-6, -18], [24, -6], [16, 16]];
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(PALETTE.nova, 0.28 + 0.12 * Math.sin(t * 4));
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(x + px, y + py) : ctx.moveTo(x + px, y + py)));
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 4; i += 1) silkLine(ctx, x + pts[i][0], y + pts[i][1], x + pts[(i + 1) % 4][0], y + pts[(i + 1) % 4][1], t + i);
    for (const [px, py] of pts) drawStar(ctx, x + px, y + py, t, 0.5);
  } else {
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, x, y + 8, PALETTE.dawn, 34, 0.9);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = PALETTE.dawn;
    ctx.beginPath();
    ctx.arc(x, y + 10, 13, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = PALETTE.dawn;
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i += 1) {
      const a = Math.PI + (i / 4) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 17, y + 10 + Math.sin(a) * 17);
      ctx.lineTo(x + Math.cos(a) * 24, y + 10 + Math.sin(a) * 24);
      ctx.stroke();
    }
    ctx.fillRect(x - 28, y + 10, 56, 2);
  }
}

const STEPS = [
  ['Fly the Weaver', 'WASD to move, Shift to dash. Starbolts fire on their own. Your Light is your life.'],
  ['Pin stars, spin silk', 'Click within reach to pin a star (costs stardust). Silk between stars burns and slows every shadow that crosses.'],
  ['Close the shape', 'Click the first star or press Space: the constellation ignites a nova on all inside. Bigger shapes, fuller nets.'],
  ['Hold until dawn', 'Survive 7 watches, take a boon after each, then bind the Eclipse in the last.'],
];

/** A pill stating how a night is won and how it is lost, in plain words. */
function stakes(ctx, cx, y, win, lose, size = 17) {
  ctx.font = `800 ${size}px ${FONT_UI}`;
  const ww = ctx.measureText(win).width;
  const lw = ctx.measureText(lose).width;
  const tag = size * 3.1;
  const total = tag + ww + 34 + tag + lw;
  let x = cx - total / 2;
  ctx.beginPath();
  ctx.roundRect(x - 20, y - size - 6, total + 40, size + 18, (size + 18) / 2);
  ctx.fillStyle = 'rgba(10,6,30,0.82)';
  ctx.fill();
  ctx.strokeStyle = rgba(PALETTE.silk, 0.35);
  ctx.stroke();
  text(ctx, 'WIN', x, y, size - 2, PALETTE.dawn, 'left', 900);
  x += tag;
  text(ctx, win, x, y, size, PALETTE.text, 'left', 800);
  x += ww + 34;
  text(ctx, 'LOSE', x, y, size - 2, PALETTE.danger, 'left', 900);
  x += tag;
  text(ctx, lose, x, y, size, PALETTE.text, 'left', 800);
}

export function drawTitle(ctx, ui, save, t) {
  logo(ctx, VIEW.width / 2, 120, 104, t);
  text(ctx, 'Pin stars to the night. Spin burning silk. Close the shape and the dark burns.', VIEW.width / 2, 182, 23, PALETTE.text, 'center', 500, FONT_DISPLAY);
  stakes(ctx, VIEW.width / 2, 228, 'hold 8 watches until dawn and bind the Eclipse', 'your Light falls to 0');

  panel(ctx, 60, 258, 570, 408, 14);
  text(ctx, 'HOW TO PLAY', 88, 292, 15, PALETTE.silk, 'left', 900);
  STEPS.forEach(([head, body], i) => {
    const y = 340 + i * 86;
    stepArt(ctx, i, 118, y, t + i);
    text(ctx, `${i + 1}. ${head}`, 166, y - 12, 20, PALETTE.silkHot, 'left', 800);
    wrap(ctx, body, 166, y + 12, 440, 20, 15, PALETTE.text, 500);
  });

  panel(ctx, 650, 258, 570, 408, 14);
  text(ctx, 'SHADOWS OF THE NIGHT', 678, 292, 15, PALETTE.silk, 'left', 900);
  const kinds = ['wisp', 'flitter', 'gnawer', 'hulk', 'lurker', 'mire'];
  kinds.forEach((type, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = 712 + col * 176;
    const cy = 340 + row * 82;
    const k = SHADOWS[type];
    const r = Math.min(k.r, 21);
    drawShadow(ctx, { type, x: cx, y: cy, r, vx: 1, vy: 0.2, seed: i * 3, flash: 0, slow: 0, cooldown: 1 }, t + i);
    text(ctx, k.name, cx + 32, cy - 3, 16, PALETTE.text, 'left', 800);
    text(ctx, k.lore, cx + 32, cy + 16, 13, PALETTE.muted, 'left', 600);
  });
  drawShadow(ctx, { type: 'eclipse', x: 700, y: 492, r: 15, vx: 0, vy: 1, seed: 0, flash: 0, hp: 1, maxHp: 1 }, t);
  text(ctx, 'Last Watch: the Eclipse. Bind it in light.', 736, 498, 16, '#ff9fbf', 'left', 800, FONT_UI);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.moveTo(678, 528);
  ctx.lineTo(1192, 528);
  ctx.stroke();
  text(ctx, 'CONTROLS', 678, 556, 15, PALETTE.silk, 'left', 900);
  const controls = [['WASD', 'fly'], ['Click', 'pin a star'], ['Space', 'close: nova'], ['Shift', 'dash'], ['Right-click / Q', 'unravel'], ['Esc', 'pause'], ['M', 'mute']];
  let cx = 678;
  let cy = 590;
  for (const [key, act] of controls) {
    ctx.font = `900 14px ${FONT_UI}`;
    const kw = ctx.measureText(key).width + 16;
    ctx.font = `600 14px ${FONT_UI}`;
    const aw = ctx.measureText(act).width;
    if (cx + kw + aw + 20 > 1200) {
      cx = 678;
      cy += 34;
    }
    ctx.beginPath();
    ctx.roundRect(cx, cy - 16, kw, 23, 6);
    ctx.fillStyle = 'rgba(255,215,122,0.16)';
    ctx.fill();
    text(ctx, key, cx + kw / 2, cy, 14, PALETTE.silkHot, 'center', 900);
    text(ctx, act, cx + kw + 7, cy, 14, PALETTE.text, 'left', 600);
    cx += kw + aw + 24;
  }

  button(ctx, ui, 'start', VIEW.width / 2 - 190, 688, 380, 58, 'BEGIN THE NIGHT', 'ENTER', true);
  button(ctx, ui, 'settings', VIEW.width / 2 + 210, 698, 150, 40, 'SETTINGS', 'S');
  const bestLine = save.best > 0 ? `Best ${save.best.toLocaleString('en-US')}  ·  Deepest watch ${save.bestWatch} / ${WATCH_COUNT}  ·  Dawns seen ${save.wins}` : 'No night woven yet: your best score is kept here.';
  text(ctx, bestLine, VIEW.width / 2, 776, 15, PALETTE.text, 'center', 700);
}

export function drawPause(ctx, ui) {
  dim(ctx, 0.62);
  panel(ctx, VIEW.width / 2 - 200, 190, 400, 330, 16);
  text(ctx, 'PAUSED', VIEW.width / 2, 250, 44, PALETTE.silkHot, 'center', 700, FONT_DISPLAY);
  text(ctx, 'The loom waits for you.', VIEW.width / 2, 280, 16, PALETTE.muted, 'center', 500, FONT_DISPLAY);
  button(ctx, ui, 'resume', VIEW.width / 2 - 140, 310, 280, 44, 'RESUME', 'ESC', true);
  button(ctx, ui, 'settings', VIEW.width / 2 - 140, 366, 280, 40, 'SETTINGS', 'S');
  button(ctx, ui, 'restart', VIEW.width / 2 - 140, 414, 280, 40, 'RESTART RUN', 'R');
  button(ctx, ui, 'title', VIEW.width / 2 - 140, 462, 280, 40, 'QUIT TO TITLE', 'T');
}

const SLIDERS = [['master', 'Master volume'], ['music', 'Music'], ['sfx', 'Effects']];

export function drawSettings(ctx, ui, settings) {
  dim(ctx, 0.7);
  panel(ctx, VIEW.width / 2 - 250, 160, 500, 400, 16);
  text(ctx, 'SETTINGS', VIEW.width / 2, 216, 40, PALETTE.silkHot, 'center', 700, FONT_DISPLAY);
  SLIDERS.forEach(([key, name], i) => {
    const y = 270 + i * 62;
    const x0 = VIEW.width / 2 - 200;
    text(ctx, name, x0, y, 15, PALETTE.text, 'left', 700);
    text(ctx, `${Math.round(settings[key] * 100)}%`, x0 + 400, y, 14, PALETTE.silk, 'right', 800);
    const bx = x0;
    const by = y + 14;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(bx, by, 400, 8, 4);
    ctx.fill();
    ctx.fillStyle = PALETTE.silk;
    ctx.beginPath();
    ctx.roundRect(bx, by, 400 * settings[key], 8, 4);
    ctx.fill();
    ctx.fillStyle = '#fff3c9';
    ctx.beginPath();
    ctx.arc(bx + 400 * settings[key], by + 4, 9, 0, Math.PI * 2);
    ctx.fill();
    ui.buttons.push({ id: `slider:${key}`, x: bx - 10, y: by - 12, w: 420, h: 32, slider: { x: bx, w: 400 } });
  });
  button(ctx, ui, 'shake', VIEW.width / 2 - 200, 456, 190, 38, settings.shake ? 'SHAKE: ON' : 'SHAKE: OFF', '');
  button(ctx, ui, 'mute', VIEW.width / 2 + 10, 456, 190, 38, settings.muted ? 'SOUND: OFF' : 'SOUND: ON', 'M');
  button(ctx, ui, 'back', VIEW.width / 2 - 100, 506, 200, 40, 'BACK', 'ESC', true);
}

const ROMAN = ['', 'I', 'II', 'III', 'IV'];

/** A pill of the run so far: score, light, harmony and watch. */
function runStatus(ctx, world, y) {
  const parts = [
    ['SCORE', world.score.toLocaleString('en-US')],
    ['LIGHT', `${Math.ceil(world.weaver.light)} / ${world.stats.maxLight}`],
    ['HARMONY', `×${world.harmony}`],
    ['WATCHES HELD', `${world.watch + 1} / ${WATCH_COUNT}`],
  ];
  ctx.font = `900 13px ${FONT_UI}`;
  const widths = parts.map(([k, v]) => {
    ctx.font = `900 13px ${FONT_UI}`;
    const kw = ctx.measureText(k).width;
    ctx.font = `800 17px ${FONT_UI}`;
    return kw + 8 + ctx.measureText(v).width;
  });
  const total = widths.reduce((a, b) => a + b, 0) + 36 * (parts.length - 1);
  let x = VIEW.width / 2 - total / 2;
  ctx.beginPath();
  ctx.roundRect(x - 20, y - 22, total + 40, 32, 16);
  ctx.fillStyle = 'rgba(10,6,30,0.8)';
  ctx.fill();
  parts.forEach(([k, v], i) => {
    ctx.font = `900 13px ${FONT_UI}`;
    const kw = ctx.measureText(k).width;
    text(ctx, k, x, y, 13, PALETTE.muted, 'left', 900);
    text(ctx, v, x + kw + 8, y, 17, PALETTE.silkHot, 'left', 800);
    x += widths[i] + 36;
  });
}

export function drawBoonChoice(ctx, ui, world, t) {
  dim(ctx, 0.5);
  const held = WATCHES[world.watch].title;
  const next = WATCHES[world.watch + 1];
  text(ctx, `${held.toUpperCase()} IS HELD`, VIEW.width / 2, 56, 52, PALETTE.dawn, 'center', 700, FONT_DISPLAY);
  text(ctx, 'The loom remembers. Choose one boon for the night ahead.', VIEW.width / 2, 92, 21, PALETTE.text, 'center', 500, FONT_DISPLAY);
  runStatus(ctx, world, 136);
  const cw = 300;
  const ch = 316;
  const gap = 34;
  const x0 = VIEW.width / 2 - (cw * 3 + gap * 2) / 2;
  world.hand.forEach((id, i) => {
    const b = boonById(id);
    const x = x0 + i * (cw + gap);
    const y = 168;
    const hover = ui.mouse.x >= x && ui.mouse.x <= x + cw && ui.mouse.y >= y && ui.mouse.y <= y + ch;
    const lift = hover ? -8 : 0;
    ui.buttons.push({ id: `boon:${i}`, x, y, w: cw, h: ch });
    ctx.save();
    ctx.translate(0, lift);
    const g = ctx.createLinearGradient(0, y, 0, y + ch);
    g.addColorStop(0, hover ? 'rgba(70,46,128,0.97)' : 'rgba(46,30,96,0.96)');
    g.addColorStop(1, 'rgba(16,10,40,0.96)');
    ctx.beginPath();
    ctx.roundRect(x, y, cw, ch, 16);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = hover ? '#fff3c9' : rgba(PALETTE.silk, 0.5);
    ctx.lineWidth = hover ? 3 : 1.4;
    ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, x + cw / 2, y + 84, PALETTE.silk, 120, hover ? 0.4 : 0.2);
    ctx.globalCompositeOperation = 'source-over';
    drawGlyph(ctx, b.glyph, x + cw / 2, y + 84, 36);
    text(ctx, b.name, x + cw / 2, y + 170, 32, PALETTE.silkHot, 'center', 700, FONT_DISPLAY);
    const lv = world.levels[id] ?? 0;
    text(ctx, lv ? `LEVEL ${ROMAN[lv]} → ${ROMAN[lv + 1]}` : 'NEW', x + cw / 2, y + 196, 13, lv ? PALETTE.nova : PALETTE.light, 'center', 900);
    wrap(ctx, b.text, x + cw / 2, y + 230, cw - 44, 22, 17, PALETTE.text, 600, 'center');
    ctx.beginPath();
    ctx.roundRect(x + cw / 2 - 20, y + ch - 46, 40, 30, 7);
    ctx.fillStyle = hover ? PALETTE.silk : 'rgba(255,255,255,0.14)';
    ctx.fill();
    text(ctx, `${i + 1}`, x + cw / 2, y + ch - 25, 18, hover ? '#2a1238' : PALETTE.silkHot, 'center', 900);
    ctx.restore();
  });

  // What the run holds so far, by name.
  const heldBoons = BOONS.filter((b) => world.levels[b.id]);
  panel(ctx, x0, 504, 470, 150, 14, rgba(PALETTE.silk, 0.35));
  text(ctx, 'YOUR BOONS', x0 + 20, 532, 14, PALETTE.silk, 'left', 900);
  heldBoons.slice(0, 8).forEach((b, i) => {
    const bx = x0 + 22 + (i % 2) * 226;
    const by = 562 + Math.floor(i / 2) * 26;
    drawGlyph(ctx, b.glyph, bx + 8, by - 5, 8.5);
    text(ctx, b.name, bx + 26, by, 15, PALETTE.text, 'left', 700);
    text(ctx, ROMAN[world.levels[b.id]], bx + 208, by, 14, PALETTE.silkHot, 'right', 900);
  });
  if (!heldBoons.length) text(ctx, 'none yet', x0 + 22, 562, 15, PALETTE.muted, 'left', 600);

  // What comes next: the Eclipse gets a portrait.
  if (next) {
    const nx = x0 + 490;
    const nw = cw * 3 + gap * 2 - 490;
    const boss = Boolean(next.boss);
    panel(ctx, nx, 504, nw, 150, 14, boss ? 'rgba(255,90,138,0.6)' : PALETTE.panelEdge);
    if (boss) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(nx, 504, nw, 150, 14);
      ctx.clip();
      const g = ctx.createRadialGradient(nx + 84, 579, 10, nx + 84, 579, 220);
      g.addColorStop(0, 'rgba(255,60,90,0.45)');
      g.addColorStop(1, 'rgba(255,60,90,0)');
      ctx.fillStyle = g;
      ctx.fillRect(nx, 504, nw, 150);
      drawShadow(ctx, { type: 'eclipse', x: nx + 84, y: 579, r: 40, vx: 0, vy: 1, seed: 0, flash: 0, hp: 1, maxHp: 1 }, t);
      ctx.restore();
    }
    const tx = boss ? nx + 170 : nx + 24;
    text(ctx, `NEXT: ${next.title.toUpperCase()}`, tx, 540, 14, PALETTE.danger, 'left', 900);
    text(ctx, boss ? 'The Eclipse rises' : next.omen, tx, 576, boss ? 32 : 20, PALETTE.text, 'left', 700, FONT_DISPLAY);
    if (boss) wrap(ctx, 'Bolts barely scratch it. Wrap it in constellations while it rings the sky with orbs.', tx, 604, nw - 190, 20, 15, PALETTE.muted, 600);
  }
  text(ctx, 'Click a card or press 1, 2, 3', VIEW.width / 2, 690, 16, PALETTE.text, 'center', 700);
}

export function drawEnd(ctx, ui, world, save, record, t) {
  const won = world.phase === 'victory';
  dim(ctx, won ? 0.06 : 0.55);
  const cx = VIEW.width / 2;
  const tag = won ? `VICTORY  ·  ALL ${WATCH_COUNT} WATCHES HELD` : `DEFEAT  ·  FELL IN THE ${WATCHES[world.watch].title.toUpperCase()}`;
  ctx.font = `900 15px ${FONT_UI}`;
  const tw = ctx.measureText(tag).width + 40;
  ctx.beginPath();
  ctx.roundRect(cx - tw / 2, 6, tw, 30, 15);
  ctx.fillStyle = won ? 'rgba(255,200,120,0.92)' : 'rgba(255,85,119,0.9)';
  ctx.fill();
  text(ctx, tag, cx, 27, 15, '#2a1238', 'center', 900);
  if (won) {
    text(ctx, 'DAWN', cx, 122, 100, '#fff1d0', 'center', 700, FONT_DISPLAY);
    text(ctx, 'The Eclipse is bound and the night is woven. The sky is yours.', cx, 162, 23, '#fff6e6', 'center', 500, FONT_DISPLAY);
  } else {
    text(ctx, 'THE LIGHT GOES OUT', cx, 116, 66, '#ff9fb4', 'center', 700, FONT_DISPLAY);
    text(ctx, 'Your Light fell to 0. The loom will wait for another night.', cx, 158, 22, PALETTE.text, 'center', 500, FONT_DISPLAY);
  }
  panel(ctx, cx - 340, 186, 680, 336, 16, won ? 'rgba(255,214,150,0.6)' : PALETTE.panelEdge);
  text(ctx, 'FINAL SCORE', cx, 220, 15, PALETTE.muted, 'center', 900);
  text(ctx, world.score.toLocaleString('en-US'), cx, 278, 62, PALETTE.silkHot, 'center', 700, FONT_DISPLAY);
  if (record) {
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, cx + 220, 258, PALETTE.nova, 64, 0.4 + 0.2 * Math.sin(t * 5));
    ctx.globalCompositeOperation = 'source-over';
    text(ctx, 'NEW BEST!', cx + 220, 265, 19, PALETTE.nova, 'center', 900);
  } else text(ctx, `best ${save.best.toLocaleString('en-US')}`, cx + 220, 265, 15, PALETTE.muted, 'center', 700);
  const s = world.stats_;
  const rows = [
    ['Watches held', `${won ? WATCH_COUNT : world.watch} / ${WATCH_COUNT}`],
    ['Shadows banished', `${s.kills}`],
    ['Constellations closed', `${s.novas}`],
    ['Largest net', `${s.bestNet} caught`],
    ['Stars pinned', `${s.stars}`],
    ['Night survived', formatTime(world.time)],
  ];
  rows.forEach(([k, v], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = cx - 310 + col * 330;
    const y = 330 + row * 42;
    text(ctx, k, x, y, 17, PALETTE.muted, 'left', 600);
    text(ctx, v, x + 290, y, 21, PALETTE.text, 'right', 800);
  });
  text(ctx, 'BOONS', cx - 310, 470, 14, PALETTE.silk, 'left', 900);
  let bx = cx - 236;
  for (const b of BOONS) {
    const lv = world.levels[b.id];
    if (!lv) continue;
    drawGlyph(ctx, b.glyph, bx, 464, 12);
    if (lv > 1) text(ctx, ROMAN[lv], bx + 15, 479, 11, PALETTE.silkHot, 'left', 900);
    bx += 40;
  }
  if (bx === cx - 236) text(ctx, 'none taken', bx, 470, 15, PALETTE.muted, 'left', 600);
  text(ctx, won ? 'The observatory wakes. Can you weave a brighter night?' : 'Tip: big shapes catch more, but gnawers and hulks break open chains.', cx, 506, 15, PALETTE.muted, 'center', 600);
  button(ctx, ui, 'restart', cx - 220, 546, 440, 64, won ? 'PLAY AGAIN' : 'TRY AGAIN', 'ENTER', true);
  ctx.fillStyle = '#2a1238';
  ctx.beginPath();
  ctx.moveTo(cx - 190, 566);
  ctx.lineTo(cx - 170, 578);
  ctx.lineTo(cx - 190, 590);
  ctx.closePath();
  ctx.fill();
  button(ctx, ui, 'title', cx - 110, 624, 220, 42, 'TITLE SCREEN', 'T');
}

const TITLE_SIGNS = [
  { name: 'The Silver Heron', pts: [[150, 70], [230, 110], [300, 88], [262, 168], [180, 160]] },
  { name: 'The Patient Fox', pts: [[1010, 60], [1110, 96], [1190, 70], [1150, 160]] },
];

/** Constellations hung in the title sky, as if from nights already woven. */
export function drawTitleSky(ctx, t) {
  TITLE_SIGNS.forEach((sg, k) => {
    const pts = sg.pts;
    for (let i = 0; i < pts.length; i += 1) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      silkLine(ctx, a[0], a[1], b[0], b[1], t + i + k, 0, 0.4);
    }
    pts.forEach(([x, y], i) => drawStar(ctx, x, y, t + i, 0.55));
    const c = pts.reduce((m, p) => [m[0] + p[0] / pts.length, m[1] + p[1] / pts.length], [0, 0]);
    text(ctx, sg.name, c[0], c[1] + 4, 14, 'rgba(220,230,255,0.55)', 'center', 500, FONT_DISPLAY);
  });
}
