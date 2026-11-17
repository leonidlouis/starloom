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
  text(ctx, label, x + w / 2 - (key ? 14 : 0), y + h / 2 + 6, 16, primary ? '#2a1238' : PALETTE.text, 'center', 800);
  if (key) text(ctx, key, x + w - 18, y + h / 2 + 5, 11, primary ? 'rgba(42,18,56,0.7)' : PALETTE.muted, 'right', 800);
}

function dim(ctx, a = 0.6) {
  ctx.fillStyle = `rgba(6,3,18,${a})`;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
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

export function drawTitle(ctx, ui, save, t) {
  logo(ctx, VIEW.width / 2, 132, 104, t);
  text(ctx, 'Pin stars to the night. Spin burning silk. Close the shape and the dark burns.', VIEW.width / 2, 196, 21, PALETTE.text, 'center', 500, FONT_DISPLAY);

  panel(ctx, 70, 222, 560, 370, 14);
  text(ctx, 'HOW TO PLAY', 96, 254, 13, PALETTE.silk, 'left', 800);
  STEPS.forEach(([head, body], i) => {
    const y = 296 + i * 74;
    stepArt(ctx, i, 126, y, t + i);
    text(ctx, `${i + 1}. ${head}`, 172, y - 10, 17, PALETTE.silkHot, 'left', 800);
    wrap(ctx, body, 172, y + 11, 430, 18, 13.5, PALETTE.text, 500);
  });

  panel(ctx, 650, 222, 560, 370, 14);
  text(ctx, 'SHADOWS OF THE NIGHT', 676, 254, 13, PALETTE.silk, 'left', 800);
  const kinds = ['wisp', 'flitter', 'gnawer', 'hulk', 'lurker', 'mire'];
  kinds.forEach((type, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = 720 + col * 172;
    const cy = 300 + row * 84;
    const k = SHADOWS[type];
    const r = Math.min(k.r, 20);
    drawShadow(ctx, { type, x: cx, y: cy, r, vx: 1, vy: 0.2, seed: i * 3, flash: 0, slow: 0, cooldown: 1 }, t + i);
    text(ctx, k.name, cx + 32, cy - 4, 14, PALETTE.text, 'left', 800);
    text(ctx, k.lore, cx + 32, cy + 14, 12, PALETTE.muted, 'left', 500);
  });
  drawShadow(ctx, { type: 'eclipse', x: 704, y: 444, r: 13, vx: 0, vy: 1, seed: 0, flash: 0, hp: 1, maxHp: 1 }, t);
  text(ctx, 'and in the Last Watch: The Eclipse, who must be bound in light', 736, 449, 13, '#ff9fbf', 'left', 700, FONT_UI);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(676, 476);
  ctx.lineTo(1184, 476);
  ctx.stroke();
  text(ctx, 'CONTROLS', 676, 498, 12, PALETTE.silk, 'left', 800);
  const controls = [['WASD', 'fly'], ['Click', 'pin / close'], ['Space', 'close shape'], ['Right-click / Q', 'unravel'], ['Shift', 'dash'], ['Esc', 'pause'], ['M', 'mute']];
  let cx = 676;
  let cy = 524;
  for (const [key, act] of controls) {
    ctx.font = `800 12px ${FONT_UI}`;
    const kw = ctx.measureText(key).width + 14;
    ctx.font = `500 12px ${FONT_UI}`;
    const aw = ctx.measureText(act).width;
    if (cx + kw + aw + 20 > 1100) {
      cx = 676;
      cy += 28;
    }
    ctx.beginPath();
    ctx.roundRect(cx, cy - 14, kw, 20, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fill();
    text(ctx, key, cx + kw / 2, cy, 12, PALETTE.silkHot, 'center', 800);
    text(ctx, act, cx + kw + 6, cy, 12, PALETTE.text, 'left', 500);
    cx += kw + aw + 22;
  }

  button(ctx, ui, 'start', VIEW.width / 2 - 170, 612, 340, 50, 'BEGIN THE NIGHT', 'ENTER', true);
  button(ctx, ui, 'settings', VIEW.width / 2 + 190, 618, 150, 38, 'SETTINGS', 'S');
  const bestLine = save.best > 0 ? `Best ${save.best.toLocaleString('en-US')}  ·  Deepest watch ${save.bestWatch} / ${WATCH_COUNT}  ·  Dawns seen ${save.wins}` : 'No night woven yet: your best score is kept here.';
  text(ctx, bestLine, VIEW.width / 2, 690, 13, PALETTE.muted, 'center', 600);
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

export function drawBoonChoice(ctx, ui, world, t) {
  dim(ctx, 0.55);
  const held = WATCHES[world.watch].title;
  const next = WATCHES[world.watch + 1];
  text(ctx, `${held.toUpperCase()} IS HELD`, VIEW.width / 2, 120, 46, PALETTE.dawn, 'center', 700, FONT_DISPLAY);
  text(ctx, 'The loom remembers. Choose one boon for the night ahead.', VIEW.width / 2, 156, 18, PALETTE.text, 'center', 500, FONT_DISPLAY);
  const cw = 300;
  const ch = 330;
  const gap = 34;
  const x0 = VIEW.width / 2 - (cw * 3 + gap * 2) / 2;
  world.hand.forEach((id, i) => {
    const b = boonById(id);
    const x = x0 + i * (cw + gap);
    const y = 196;
    const hover = ui.mouse.x >= x && ui.mouse.x <= x + cw && ui.mouse.y >= y && ui.mouse.y <= y + ch;
    const lift = hover ? -8 : 0;
    ui.buttons.push({ id: `boon:${i}`, x, y, w: cw, h: ch });
    ctx.save();
    ctx.translate(0, lift);
    const g = ctx.createLinearGradient(0, y, 0, y + ch);
    g.addColorStop(0, 'rgba(46,30,96,0.96)');
    g.addColorStop(1, 'rgba(16,10,40,0.96)');
    ctx.beginPath();
    ctx.roundRect(x, y, cw, ch, 16);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = hover ? '#fff3c9' : rgba(PALETTE.silk, 0.5);
    ctx.lineWidth = hover ? 2.5 : 1.4;
    ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, x + cw / 2, y + 92, PALETTE.silk, 120, hover ? 0.32 : 0.2);
    ctx.globalCompositeOperation = 'source-over';
    drawGlyph(ctx, b.glyph, x + cw / 2, y + 92, 34);
    text(ctx, b.name, x + cw / 2, y + 178, 28, PALETTE.silkHot, 'center', 700, FONT_DISPLAY);
    const lv = world.levels[id] ?? 0;
    for (let k = 0; k < b.max; k += 1) {
      ctx.fillStyle = k < lv ? PALETTE.silk : k === lv ? '#ffffff' : 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(x + cw / 2 + (k - (b.max - 1) / 2) * 16, y + 198, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    wrap(ctx, b.text, x + cw / 2, y + 232, cw - 50, 21, 15, PALETTE.text, 500, 'center');
    ctx.beginPath();
    ctx.roundRect(x + cw / 2 - 18, y + ch - 46, 36, 28, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();
    text(ctx, `${i + 1}`, x + cw / 2, y + ch - 26, 16, PALETTE.silkHot, 'center', 800);
    ctx.restore();
  });
  if (next) {
    panel(ctx, VIEW.width / 2 - 330, 566, 660, 56, 12);
    text(ctx, `NEXT: ${next.title.toUpperCase()}`, VIEW.width / 2, 590, 13, PALETTE.danger, 'center', 800);
    text(ctx, next.omen, VIEW.width / 2, 611, 17, PALETTE.text, 'center', 500, FONT_DISPLAY);
  }
  text(ctx, 'Click a card or press 1, 2, 3', VIEW.width / 2, 652, 13, PALETTE.muted, 'center', 600);
}

export function drawEnd(ctx, ui, world, save, record, t) {
  const won = world.phase === 'victory';
  dim(ctx, won ? 0.25 : 0.55);
  const cx = VIEW.width / 2;
  if (won) {
    text(ctx, 'DAWN', cx, 128, 96, '#fff1d0', 'center', 700, FONT_DISPLAY);
    text(ctx, 'The Eclipse is bound and the night is woven. The sky is yours.', cx, 168, 21, '#fff6e6', 'center', 500, FONT_DISPLAY);
  } else {
    text(ctx, 'THE LIGHT GOES OUT', cx, 122, 64, '#ff9fb4', 'center', 700, FONT_DISPLAY);
    text(ctx, `The shadows took the ${WATCHES[world.watch].title.toLowerCase()}. The loom will wait for another night.`, cx, 162, 20, PALETTE.text, 'center', 500, FONT_DISPLAY);
  }
  panel(ctx, cx - 330, 196, 660, 330, 16, won ? 'rgba(255,214,150,0.6)' : PALETTE.panelEdge);
  text(ctx, 'FINAL SCORE', cx, 232, 13, PALETTE.muted, 'center', 800);
  text(ctx, world.score.toLocaleString('en-US'), cx, 286, 56, PALETTE.silkHot, 'center', 700, FONT_DISPLAY);
  if (record) {
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, cx + 200, 268, PALETTE.nova, 60, 0.4 + 0.2 * Math.sin(t * 5));
    ctx.globalCompositeOperation = 'source-over';
    text(ctx, 'NEW BEST!', cx + 200, 274, 16, PALETTE.nova, 'center', 900);
  } else text(ctx, `best ${save.best.toLocaleString('en-US')}`, cx + 200, 274, 13, PALETTE.muted, 'center', 700);
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
    const x = cx - 300 + col * 320;
    const y = 336 + row * 40;
    text(ctx, k, x, y, 15, PALETTE.muted, 'left', 600);
    text(ctx, v, x + 280, y, 18, PALETTE.text, 'right', 800);
  });
  text(ctx, 'BOONS', cx - 300, 470, 12, PALETTE.silk, 'left', 800);
  let bx = cx - 240;
  for (const b of BOONS) {
    const lv = world.levels[b.id];
    if (!lv) continue;
    drawGlyph(ctx, b.glyph, bx, 465, 11);
    if (lv > 1) text(ctx, `${lv}`, bx + 14, 478, 10, PALETTE.silkHot, 'left', 800);
    bx += 36;
  }
  if (bx === cx - 240) text(ctx, 'none taken', bx, 470, 13, PALETTE.muted, 'left', 500);
  text(ctx, won ? 'A new night waits, harder to weave? Only one way to find out.' : 'Tip: big shapes catch more, but gnawers and hulks break open chains.', cx, 506, 13, PALETTE.muted, 'center', 500);
  button(ctx, ui, 'restart', cx - 170, 552, 340, 50, won ? 'WEAVE ANOTHER NIGHT' : 'TRY AGAIN', 'ENTER', true);
  button(ctx, ui, 'title', cx - 100, 614, 200, 38, 'TITLE', 'T');
}

const TITLE_SIGNS = [
  { name: 'The Silver Heron', pts: [[150, 70], [230, 110], [300, 88], [262, 168], [180, 160]] },
  { name: 'The Patient Fox', pts: [[1010, 60], [1110, 96], [1190, 70], [1150, 160]] },
  { name: 'The Lantern Gate', pts: [[60, 610], [140, 640], [210, 600]] },
  { name: 'The Quiet Ship', pts: [[1060, 610], [1150, 630], [1230, 596], [1170, 650]] },
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
