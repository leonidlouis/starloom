// The menus and full screens: title with how-to-play and the bestiary, pause, settings with
// volume sliders, the boon choice after each watch, and the dawn (victory) and darkness (defeat)
// result screens with the run's stats and a restart. Each registers its buttons for the mouse.
import { FONT_DISPLAY, FONT_UI, PALETTE, SHADOWS, VIEW, WATCH_COUNT } from './config.js';
import { BOONS, boonById } from './boons.js';
import { WATCHES } from './waves.js';
import { panel } from './hud.js';
import { runGrade } from './world.js';
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
  text(ctx, label, x + w / 2 - (key ? 14 : 0), y + h / 2 + (h >= 80 ? 14 : h >= 64 ? 10 : 6), h >= 80 ? 38 : h >= 64 ? 28 : h >= 50 ? 19 : 16, primary ? '#2a1238' : PALETTE.text, 'center', 800);
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

/** A big full-width rule bar: WIN in green or LOSE in red. */
function ruleBar(ctx, x, y, w, h, tagText, body, color, back) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, color);
  g.addColorStop(1, back);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, tagText, x + 30, y + h / 2 + 11, 30, '#ffffff', 'left', 900);
  text(ctx, body, x + 150, y + h / 2 + 11, 30, '#ffffff', 'left', 800);
}

const TITLE_TILES = [
  ['PIN STARS', 'CLICK', 0],
  ['SILK BURNS', 'AUTO', 1],
  ['CLOSE: NOVA!', 'SPACE', 2],
  ['8 WATCHES', 'SURVIVE', 3],
];

export function drawTitle(ctx, ui, save, t) {
  logo(ctx, VIEW.width / 2, 126, 116, t);
  text(ctx, 'Pin stars to the night. Spin burning silk. Close the shape and the dark burns.', VIEW.width / 2, 194, 25, PALETTE.text, 'center', 600, FONT_DISPLAY);
  ruleBar(ctx, 150, 218, 980, 58, 'WIN', 'Hold 8 watches, then break the Eclipse', '#2fbf71', 'rgba(20,80,50,0.9)');
  ruleBar(ctx, 150, 286, 980, 58, 'LOSE', 'Your Light falls to 0', '#e8435f', 'rgba(90,20,35,0.9)');

  // Four big tiles: the whole loop at a glance.
  const tw = 282;
  const gap = 18;
  const x0 = VIEW.width / 2 - (tw * 4 + gap * 3) / 2;
  TITLE_TILES.forEach(([head, key, art], i) => {
    const x = x0 + i * (tw + gap);
    const y = 362;
    panel(ctx, x, y, tw, 232, 16, rgba(PALETTE.silk, 0.45));
    text(ctx, `${i + 1}`, x + 22, y + 40, 30, PALETTE.dawn, 'left', 900);
    ctx.save();
    ctx.translate(x + tw / 2, y + 96);
    ctx.scale(2.1, 2.1);
    if (i < 3) stepArt(ctx, art, 0, 0, t + i);
    if (i === 0) drawStar(ctx, 30, -14, t, 0.7);
    ctx.restore();
    if (i === 3) {
      ['wisp', 'gnawer', 'hulk', 'lurker', 'mire', 'eclipse'].forEach((type, k) => {
        const r = type === 'eclipse' ? 12 : Math.min(SHADOWS[type].r, 17);
        drawShadow(ctx, { type, x: x + 62 + (k % 3) * 80, y: y + 68 + Math.floor(k / 3) * 54, r, vx: 1, vy: 0.2, seed: k, flash: 0, slow: 0, cooldown: 1, hp: 1, maxHp: 1 }, t + k);
      });
    }
    text(ctx, head, x + tw / 2, y + 182, 30, PALETTE.silkHot, 'center', 900);
    ctx.font = `900 18px ${FONT_UI}`;
    const kw = ctx.measureText(key).width + 24;
    ctx.beginPath();
    ctx.roundRect(x + tw / 2 - kw / 2, y + 196, kw, 26, 7);
    ctx.fillStyle = 'rgba(255,215,122,0.2)';
    ctx.fill();
    text(ctx, key, x + tw / 2, y + 215, 18, '#ffffff', 'center', 900);
  });

  // Controls in big key caps.
  const controls = [['WASD', 'fly'], ['CLICK', 'pin'], ['SPACE', 'close'], ['SHIFT', 'dash'], ['ESC', 'pause']];
  const parts = controls.map(([k, a]) => {
    ctx.font = `900 22px ${FONT_UI}`;
    const kw = ctx.measureText(k).width + 22;
    ctx.font = `700 22px ${FONT_UI}`;
    return { k, a, kw, aw: ctx.measureText(a).width };
  });
  const total = parts.reduce((sum, p) => sum + p.kw + 10 + p.aw + 30, -30);
  let cx = VIEW.width / 2 - total / 2;
  for (const p of parts) {
    ctx.beginPath();
    ctx.roundRect(cx, 612, p.kw, 34, 8);
    ctx.fillStyle = 'rgba(255,215,122,0.22)';
    ctx.fill();
    ctx.strokeStyle = rgba(PALETTE.silk, 0.6);
    ctx.stroke();
    text(ctx, p.k, cx + p.kw / 2, 637, 22, PALETTE.silkHot, 'center', 900);
    text(ctx, p.a, cx + p.kw + 10, 637, 22, PALETTE.text, 'left', 700);
    cx += p.kw + 10 + p.aw + 30;
  }

  button(ctx, ui, 'start', VIEW.width / 2 - 230, 668, 460, 72, 'BEGIN THE NIGHT', 'ENTER', true);
  button(ctx, ui, 'settings', VIEW.width / 2 + 252, 684, 150, 42, 'SETTINGS', 'S');
  const bestLine = save.best > 0 ? `Best ${save.best.toLocaleString('en-US')}  ·  Deepest watch ${save.bestWatch} / ${WATCH_COUNT}  ·  Dawns seen ${save.wins}` : 'No night woven yet: your best score is kept here.';
  text(ctx, bestLine, VIEW.width / 2, 776, 16, PALETTE.text, 'center', 700);
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
  dim(ctx, 0.55);
  const held = WATCHES[world.watch].title;
  const next = WATCHES[world.watch + 1];
  const cx = VIEW.width / 2;
  const tagText = `${held.toUpperCase()} HELD  ·  ${world.watch + 1} / ${WATCH_COUNT}`;
  ctx.font = `900 22px ${FONT_UI}`;
  const tw = ctx.measureText(tagText).width + 44;
  ctx.beginPath();
  ctx.roundRect(cx - tw / 2, -18, tw, 38, 19);
  ctx.fillStyle = '#2fbf71';
  ctx.fill();
  text(ctx, tagText, cx, 9, 22, '#ffffff', 'center', 900);
  text(ctx, 'CHOOSE A BOON', cx, 88, 72, PALETTE.dawn, 'center', 700, FONT_DISPLAY);
  const cw = 344;
  const ch = 364;
  const gap = 24;
  const x0 = cx - (cw * 3 + gap * 2) / 2;
  world.hand.forEach((id, i) => {
    const b = boonById(id);
    const x = x0 + i * (cw + gap);
    const y = 112;
    const hover = ui.mouse.x >= x && ui.mouse.x <= x + cw && ui.mouse.y >= y && ui.mouse.y <= y + ch;
    const lift = hover ? -8 : 0;
    ui.buttons.push({ id: `boon:${i}`, x, y, w: cw, h: ch });
    ctx.save();
    ctx.translate(0, lift);
    const g = ctx.createLinearGradient(0, y, 0, y + ch);
    g.addColorStop(0, hover ? 'rgba(84,56,150,0.98)' : 'rgba(54,36,112,0.97)');
    g.addColorStop(1, 'rgba(18,12,46,0.97)');
    ctx.beginPath();
    ctx.roundRect(x, y, cw, ch, 18);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = hover ? '#fff3c9' : rgba(PALETTE.silk, 0.6);
    ctx.lineWidth = hover ? 4 : 2;
    ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, x + cw / 2, y + 86, PALETTE.silk, 130, hover ? 0.45 : 0.25);
    ctx.globalCompositeOperation = 'source-over';
    drawGlyph(ctx, b.glyph, x + cw / 2, y + 86, 46);
    text(ctx, b.name, x + cw / 2, y + 196, 42, PALETTE.silkHot, 'center', 700, FONT_DISPLAY);
    const lv = world.levels[id] ?? 0;
    text(ctx, lv ? `LEVEL ${ROMAN[lv]} → ${ROMAN[lv + 1]}` : 'NEW BOON', x + cw / 2, y + 228, 19, lv ? PALETTE.nova : PALETTE.light, 'center', 900);
    wrap(ctx, b.text, x + cw / 2, y + 268, cw - 40, 27, 21, PALETTE.text, 700, 'center');
    ctx.beginPath();
    ctx.roundRect(x + cw / 2 - 26, y + ch - 56, 52, 40, 9);
    ctx.fillStyle = hover ? PALETTE.silk : 'rgba(255,255,255,0.16)';
    ctx.fill();
    text(ctx, `${i + 1}`, x + cw / 2, y + ch - 26, 26, hover ? '#2a1238' : PALETTE.silkHot, 'center', 900);
    ctx.restore();
  });

  // What comes next (the Eclipse gets its portrait), and the boons already held.
  const sy = 496;
  const sw = cw * 3 + gap * 2;
  const boss = Boolean(next && next.boss);
  panel(ctx, x0, sy, sw, 150, 16, boss ? 'rgba(255,90,138,0.7)' : PALETTE.panelEdge);
  if (next) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x0, sy, sw, 150, 16);
    ctx.clip();
    if (boss) {
      const g = ctx.createRadialGradient(x0 + 90, sy + 75, 10, x0 + 90, sy + 75, 300);
      g.addColorStop(0, 'rgba(255,60,90,0.5)');
      g.addColorStop(1, 'rgba(255,60,90,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x0, sy, sw, 150);
      drawShadow(ctx, { type: 'eclipse', x: x0 + 90, y: sy + 75, r: 44, vx: 0, vy: 1, seed: 0, flash: 0, hp: 1, maxHp: 1 }, t);
    }
    ctx.restore();
    const tx = boss ? x0 + 186 : x0 + 30;
    text(ctx, `NEXT: ${next.title.toUpperCase()}`, tx, sy + 44, 22, '#ff7a93', 'left', 900);
    text(ctx, boss ? 'The Eclipse rises' : next.omen, tx, sy + 98, boss ? 50 : 30, '#ffffff', 'left', 700, FONT_DISPLAY);
  }
  const heldBoons = BOONS.filter((b) => world.levels[b.id]);
  const bx = x0 + sw - 330;
  text(ctx, `YOUR BOONS: ${heldBoons.length}`, bx, sy + 44, 20, PALETTE.silk, 'left', 900);
  heldBoons.slice(0, 8).forEach((b, i) => drawGlyph(ctx, b.glyph, bx + 20 + (i % 4) * 78, sy + 82 + Math.floor(i / 4) * 40, 15));
  text(ctx, 'CLICK A CARD OR PRESS 1, 2, 3', cx, 700, 24, '#ffffff', 'center', 900);
}

const GRADE_COLORS = { S: '#ffd86b', A: '#7ff0a8', B: '#8fd0ff', C: '#d6a8ff', D: '#ff8fa3' };

export function drawEnd(ctx, ui, world, save, record, t) {
  const won = world.phase === 'victory';
  dim(ctx, won ? 0.06 : 0.55);
  const cx = VIEW.width / 2;
  const tag = won ? `VICTORY  ·  ALL ${WATCH_COUNT} WATCHES HELD` : `DEFEAT  ·  FELL IN THE ${WATCHES[world.watch].title.toUpperCase()}`;
  ctx.font = `900 22px ${FONT_UI}`;
  const tw = ctx.measureText(tag).width + 48;
  ctx.beginPath();
  ctx.roundRect(cx - tw / 2, -20, tw, 40, 20);
  ctx.fillStyle = won ? '#2fbf71' : '#e8435f';
  ctx.fill();
  text(ctx, tag, cx, 8, 22, '#ffffff', 'center', 900);
  if (won) text(ctx, 'DAWN: YOU WIN', cx, 108, 88, '#fff1d0', 'center', 700, FONT_DISPLAY);
  else text(ctx, 'THE LIGHT GOES OUT', cx, 104, 76, '#ffb3c2', 'center', 700, FONT_DISPLAY);

  panel(ctx, cx - 390, 136, 780, 330, 18, won ? 'rgba(255,214,150,0.7)' : PALETTE.panelEdge);
  text(ctx, 'FINAL SCORE', cx - 90, 182, 20, PALETTE.muted, 'center', 900);
  text(ctx, world.score.toLocaleString('en-US'), cx - 90, 254, 92, PALETTE.silkHot, 'center', 700, FONT_DISPLAY);
  text(ctx, record ? 'NEW BEST!' : `BEST ${save.best.toLocaleString('en-US')}`, cx - 90, 316, record ? 24 : 18, record ? PALETTE.nova : PALETTE.muted, 'center', 900);
  // Grade badge.
  const grade = runGrade(world);
  const gx = cx + 250;
  const gy = 236;
  ctx.globalCompositeOperation = 'lighter';
  drawGlow(ctx, gx, gy, GRADE_COLORS[grade], 120, 0.45);
  ctx.globalCompositeOperation = 'source-over';
  ctx.beginPath();
  ctx.arc(gx, gy, 66, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(14,8,36,0.95)';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = GRADE_COLORS[grade];
  ctx.stroke();
  text(ctx, grade, gx, gy + 32, 92, GRADE_COLORS[grade], 'center', 900);
  text(ctx, 'GRADE', gx, gy + 96, 18, PALETTE.muted, 'center', 900);

  const s = world.stats_;
  const cells = [
    [`${won ? WATCH_COUNT : world.watch}/${WATCH_COUNT}`, 'WATCHES'],
    [`${s.kills}`, 'BANISHED'],
    [`${s.novas}`, 'NOVAS'],
    [`${s.bestNet}`, 'BEST NET'],
  ];
  cells.forEach(([v, k], i) => {
    const x = cx - 292 + i * 195;
    text(ctx, v, x, 400, 44, '#ffffff', 'center', 900);
    text(ctx, k, x, 432, 17, PALETTE.muted, 'center', 900);
  });
  button(ctx, ui, 'restart', cx - 270, 494, 540, 88, won ? 'PLAY AGAIN' : 'TRY AGAIN', 'ENTER', true);
  ctx.fillStyle = '#2a1238';
  ctx.beginPath();
  ctx.moveTo(cx - 222, 520);
  ctx.lineTo(cx - 194, 538);
  ctx.lineTo(cx - 222, 556);
  ctx.closePath();
  ctx.fill();
  button(ctx, ui, 'title', cx - 120, 600, 240, 46, 'TITLE SCREEN', 'T');
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
