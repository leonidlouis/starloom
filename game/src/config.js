// Every tuning number, colour and font of STARLOOM in one place. The playfield is a fixed
// 1280x800 (16:10) logical sky; the renderer scales it to the window, so no rule depends on screen size.

export const VIEW = { width: 1280, height: 800, horizon: 744 };

/** The simulation's fixed step: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const WEAVER = {
  radius: 11,
  speed: 290,
  light: 100,
  dashSpeed: 980,
  dashTime: 0.15,
  dashCooldown: 1.5,
  hurtGrace: 0.75,
  reach: 250,
  boltCooldown: 0.36,
  boltSpeed: 620,
  boltDamage: 11,
  boltRange: 330,
  magnet: 90,
};

export const LOOM = {
  maxStars: 5,
  starCost: 12,
  dustMax: 100,
  dustStart: 60,
  dustRegen: 7,
  threadDps: 34,
  threadSlow: 0.45,
  threadHp: 100,
  closeRadius: 30,
  novaBase: 55,
  novaPerStar: 16,
  novaAreaBonus: 1 / 30000,
  minStarGap: 34,
};

/** The shadows of the night. r: radius, hp, speed (px/s), touch: light drained on contact. */
export const SHADOWS = {
  wisp: { name: 'Wisp', r: 9, hp: 14, speed: 92, touch: 7, score: 10, dust: 2, lore: 'drifts in swarms' },
  flitter: { name: 'Flitter', r: 11, hp: 22, speed: 135, touch: 8, score: 15, dust: 3, lore: 'weaves past bolts' },
  gnawer: { name: 'Gnawer', r: 13, hp: 38, speed: 105, touch: 10, score: 25, dust: 4, lore: 'eats your stars' },
  hulk: { name: 'Umbral Hulk', r: 27, hp: 170, speed: 46, touch: 18, score: 60, dust: 10, lore: 'snaps silk threads' },
  lurker: { name: 'Lurker', r: 16, hp: 46, speed: 70, touch: 10, score: 35, dust: 5, lore: 'spits dark orbs' },
  mire: { name: 'Mire', r: 20, hp: 72, speed: 62, touch: 14, score: 40, dust: 6, lore: 'splits into wisps' },
  eclipse: { name: 'The Eclipse', r: 62, hp: 2200, speed: 34, touch: 30, score: 2500, dust: 0, lore: 'the last dark' },
};

/** Thread damage a hulk deals per second to any silk it touches. */
export const HULK_SNAP_DPS = 140;

export const PALETTE = {
  skyTop: '#0a0d2c',
  skyMid: '#1f1552',
  skyLow: '#5a2272',
  horizonGlow: '#ff8f6b',
  ridge: '#06040f',
  ridgeRim: '#4b2a6e',
  silk: '#ffd77a',
  silkHot: '#fff3c9',
  star: '#bff6ff',
  starCore: '#ffffff',
  nova: '#ffcf6a',
  weaver: '#8ff3ff',
  weaverCore: '#ffffff',
  bolt: '#aef9ff',
  ink: '#090512',
  inkRim: '#b45ad6',
  eye: '#ff3f78',
  orb: '#c23bff',
  dust: '#ffe9a8',
  light: '#7ff0ff',
  danger: '#ff5577',
  text: '#f3ecff',
  muted: '#a99cc8',
  panel: 'rgba(14, 9, 38, 0.82)',
  panelEdge: 'rgba(255, 215, 122, 0.38)',
  dawn: '#ffb26b',
};

export const FONT_DISPLAY = '"Cormorant Garamond", "Palatino Linotype", Palatino, Georgia, serif';
export const FONT_UI = '"Mulish", "Segoe UI", system-ui, -apple-system, sans-serif';

/** Where the best score and settings live between visits (this browser only). */
export const SAVE_KEY = 'starloom.save.v1';

export const WATCH_COUNT = 8;
