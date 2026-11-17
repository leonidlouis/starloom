// Boot and the one loop. Input is read every frame, the world advances in fixed 1/60 s steps,
// and the frame is painted: sky, the world, the HUD, then whichever screen is up (title, pause,
// settings, boon choice, dawn or darkness). Sounds follow the world's events.
//
// ?seed=N fixes the night. ?shot=<name>&seed=N stages a screenshot scene (see shots.js) instead
// of running the loop, paints it and sets window.__shotReady.
import { STEP, VIEW, WATCH_COUNT } from './config.js';
import { createWorld, chooseBoon, endSettled, resetRun, stepWorld, PHASE_BOON, PHASE_DEFEAT, PHASE_VICTORY, PHASE_WATCH } from './world.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { loadSave, recordRun, writeSave } from './save.js';
import { createSky } from './sky.js';
import { drawWorld } from './render.js';
import { drawHud } from './hud.js';
import { drawBoonChoice, drawEnd, drawPause, drawSettings, drawTitle, drawTitleSky } from './screens.js';
import { WATCHES } from './waves.js';
import { stageShot } from './shots.js';
import { rgba } from './sprites.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const sky = createSky(11);
const save = shot ? loadDefaultsForShot() : loadSave();
const audio = createAudio(save.settings);
const world = createWorld(seed);

const app = { screen: 'title', back: 'title', record: false, recorded: false, buttons: [], mouse: { x: -1, y: -1 }, time: 0, dragging: null };
let view = { scale: 1, ox: 0, oy: 0, dpr: 1 };

function loadDefaultsForShot() {
  return { best: 48210, bestWatch: 8, runs: 12, wins: 2, settings: { master: 0.8, music: 0.7, sfx: 0.9, shake: true, muted: true } };
}

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const scale = Math.min(w / VIEW.width, h / VIEW.height);
  view = { scale, ox: (w - VIEW.width * scale) / 2, oy: (h - VIEW.height * scale) / 2, dpr };
}

function toLogical(cx, cy) {
  const r = canvas.getBoundingClientRect();
  return { x: (cx - r.left - view.ox) / view.scale, y: (cy - r.top - view.oy) / view.scale };
}

function announce(msg) {
  status.textContent = msg;
}

function dawnLevel() {
  if (app.screen === 'title') return 0.12;
  if (world.phase === PHASE_VICTORY) return Math.min(1, world.phaseTime / 2.5);
  const watch = WATCHES[world.watch];
  if (world.phase === PHASE_WATCH) return watch.duration ? 0.3 * Math.min(1, world.watchTime / watch.duration) : 0;
  if (world.phase === PHASE_DEFEAT) return 0;
  return 0.45;
}

/** Paint one frame of whatever is up. */
function paint(aim) {
  const { scale, ox, oy, dpr } = view;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#020108';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let sx = 0;
  let sy = 0;
  if (save.settings.shake && world.fx.shake > 0 && app.screen !== 'title') {
    sx = (Math.random() - 0.5) * world.fx.shake;
    sy = (Math.random() - 0.5) * world.fx.shake;
    if (shot) {
      sx = world.fx.shake * 0.12;
      sy = -world.fx.shake * 0.08;
    }
  }
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, (ox + sx * scale) * dpr, (oy + sy * scale) * dpr);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, VIEW.width, VIEW.height);
  ctx.clip();
  const t = app.time;
  sky.draw(ctx, t, dawnLevel());
  if (app.screen === 'title') {
    drawTitleSky(ctx, t);
    sky.drawRidge(ctx);
  } else {
    sky.drawRidge(ctx);
    drawWorld(ctx, world, t, aim, app.screen === 'play');
  }
  if (world.fx.flash > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(world.fx.flashColor, world.fx.flash * 0.35);
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.globalCompositeOperation = 'source-over';
  }
  const vg = ctx.createRadialGradient(VIEW.width / 2, VIEW.height / 2, VIEW.height * 0.45, VIEW.width / 2, VIEW.height / 2, VIEW.height * 0.95);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(2,0,10,0.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  app.buttons = [];
  const ui = { mouse: app.mouse, buttons: app.buttons };
  if (app.screen === 'title') drawTitle(ctx, ui, save, t);
  else {
    if (world.phase === PHASE_WATCH || world.phase === 'dawnbell') drawHud(ctx, world, save.best, aim);
    if (world.phase === PHASE_BOON) drawBoonChoice(ctx, ui, world, t);
    if ((world.phase === PHASE_VICTORY || world.phase === PHASE_DEFEAT) && world.phaseTime > 1.2) drawEnd(ctx, ui, world, save, app.record, t);
    if (app.screen === 'paused') drawPause(ctx, ui);
  }
  if (app.screen === 'settings') drawSettings(ctx, ui, save.settings);
  ctx.restore();
}

function startRun() {
  resetRun(world);
  app.screen = 'play';
  app.recorded = false;
  app.record = false;
  audio.setIntensity(0);
  announce('First watch. Pin stars with the mouse, close shapes with Space.');
}

function finishRun() {
  if (app.recorded) return;
  app.recorded = true;
  const won = world.phase === PHASE_VICTORY;
  app.record = recordRun(save, { score: world.score, watch: won ? WATCH_COUNT : world.watch, won });
  announce(`${won ? 'Dawn. You won.' : 'The light goes out.'} Score ${world.score}.`);
}

function openSettings() {
  app.back = app.screen;
  app.screen = 'settings';
}

function setSlider(id, x) {
  const b = app.buttons.find((k) => k.id === id);
  if (!b) return;
  const key = id.split(':')[1];
  save.settings[key] = Math.max(0, Math.min(1, (x - b.slider.x) / b.slider.w));
  audio.applyVolumes();
  writeSave(save);
}

function pressButton(id, x) {
  audio.play('ui');
  if (id === 'start' || (id === 'restart' && app.screen !== 'settings')) startRun();
  else if (id === 'settings') openSettings();
  else if (id === 'resume') app.screen = 'play';
  else if (id === 'title') app.screen = 'title';
  else if (id === 'back') app.screen = app.back;
  else if (id === 'shake') save.settings.shake = !save.settings.shake;
  else if (id === 'mute') save.settings.muted = !save.settings.muted;
  else if (id.startsWith('boon:')) chooseBoon(world, Number(id.split(':')[1]));
  else if (id.startsWith('slider:')) {
    setSlider(id, x);
    app.dragging = id;
  }
  audio.applyVolumes();
  writeSave(save);
}

function handleKeys(presses) {
  for (const code of presses) {
    if (code === 'KeyM') {
      save.settings.muted = !save.settings.muted;
      audio.applyVolumes();
      writeSave(save);
      continue;
    }
    if (app.screen === 'title') {
      if (code === 'Enter' || code === 'Space') startRun();
      else if (code === 'KeyS') openSettings();
    } else if (app.screen === 'settings') {
      if (code === 'Escape' || code === 'Enter') app.screen = app.back;
    } else if (app.screen === 'paused') {
      if (code === 'Escape' || code === 'KeyP' || code === 'Enter') app.screen = 'play';
      else if (code === 'KeyS') openSettings();
      else if (code === 'KeyR') startRun();
      else if (code === 'KeyT') app.screen = 'title';
    } else if (app.screen === 'play') {
      if (world.phase === PHASE_BOON) {
        const slot = ['Digit1', 'Digit2', 'Digit3'].indexOf(code);
        if (slot >= 0) chooseBoon(world, slot);
      } else if (endSettled(world)) {
        if (code === 'Enter' || code === 'Space' || code === 'KeyR') startRun();
        else if (code === 'KeyT' || code === 'Escape') app.screen = 'title';
      } else if (code === 'Escape' || code === 'KeyP') app.screen = 'paused';
    }
  }
}

function playEvents() {
  for (const e of world.events) {
    audio.play(e.type, e.data);
    if (e.type === 'watch') {
      audio.setIntensity(e.data.index / (WATCH_COUNT - 1));
      announce(`${WATCHES[e.data.index].title}. ${WATCHES[e.data.index].omen}`);
    } else if (e.type === 'hand') announce('Watch held. Choose a boon: 1, 2 or 3.');
    else if (e.type === 'victory' || e.type === 'defeat') finishRun();
  }
  world.events.length = 0;
}

function runGame() {
  const input = createInput(canvas, toLogical);
  let acc = 0;
  let last = performance.now();
  canvas.addEventListener('pointerdown', () => audio.unlock());
  window.addEventListener('keydown', () => audio.unlock());
  canvas.addEventListener('pointermove', (e) => {
    const p = toLogical(e.clientX, e.clientY);
    app.mouse.x = p.x;
    app.mouse.y = p.y;
    if (app.dragging && input.mouse.down) setSlider(app.dragging, p.x);
  });
  window.addEventListener('pointerup', () => (app.dragging = null));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && app.screen === 'play' && world.phase === PHASE_WATCH) app.screen = 'paused';
  });

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    app.time += dt;
    const { presses, clicks } = input.take();
    handleKeys(presses);
    const play = { moveX: 0, moveY: 0, aimX: input.mouse.x, aimY: input.mouse.y, place: false, close: false, unravel: false, dash: false };
    for (const c of clicks) {
      const hit = app.buttons.find((b) => c.x >= b.x && c.x <= b.x + b.w && c.y >= b.y && c.y <= b.y + b.h);
      if (hit && c.button === 0) pressButton(hit.id, c.x);
      else if (app.screen === 'play' && world.phase === PHASE_WATCH) {
        if (c.button === 0) {
          play.place = true;
          play.aimX = c.x;
          play.aimY = c.y;
        } else if (c.button === 2) play.unravel = true;
      } else if (app.screen === 'play' && endSettled(world) && c.button === 0 && !hit) {
        // a stray click on the end screen does nothing; the buttons restart
      }
    }
    if (app.screen === 'play') {
      const m = input.move();
      play.moveX = m.x;
      play.moveY = m.y;
      play.close = presses.includes('Space') || presses.includes('KeyE');
      play.unravel = play.unravel || presses.includes('KeyQ');
      play.dash = presses.includes('ShiftLeft') || presses.includes('ShiftRight');
      acc += dt;
      let first = true;
      while (acc >= STEP) {
        stepWorld(world, first ? play : { ...play, place: false, close: false, unravel: false, dash: false }, STEP);
        first = false;
        acc -= STEP;
      }
      playEvents();
    } else {
      acc = 0;
      if (app.screen === 'title') {
        world.fx.particles.length = 0;
      }
    }
    paint({ x: input.mouse.x, y: input.mouse.y });
  }
  announce('STARLOOM. Press Enter to begin the night.');
  requestAnimationFrame(frame);
}

function runShot(name) {
  const scene = stageShot(name, world, app, save);
  app.mouse = scene.mouse ?? { x: -100, y: -100 };
  let painted = 0;
  function again() {
    paint(scene.aim);
    painted += 1;
    if (painted < 2) requestAnimationFrame(again);
    else window.__shotReady = true;
  }
  requestAnimationFrame(again);
}

resize();
window.addEventListener('resize', resize);
// ?debug=1 exposes the live run to the console (and to automated playtests).
if (params.get('debug') === '1') window.__starloom = { world, app };
if (shot) runShot(shot);
else runGame();
