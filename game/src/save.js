// The save: best score, deepest watch reached, runs played and the player's settings, kept in
// localStorage. Storage may be off (private windows); the game then simply forgets on reload.
import { SAVE_KEY } from './config.js';

const DEFAULTS = { best: 0, bestWatch: 0, runs: 0, wins: 0, settings: { master: 0.8, music: 0.7, sfx: 0.9, shake: true, muted: false } };

export function loadSave() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(SAVE_KEY) ?? 'null');
    if (raw && typeof raw === 'object') return { ...DEFAULTS, ...raw, settings: { ...DEFAULTS.settings, ...(raw.settings ?? {}) } };
  } catch {
    // fall through to the defaults
  }
  return structuredClone(DEFAULTS);
}

export function writeSave(save) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // storage unavailable: keep playing
  }
}

/** Fold a finished run into the save; returns true when it set a new best score. */
export function recordRun(save, run) {
  const record = run.score > save.best;
  save.best = Math.max(save.best, run.score);
  save.bestWatch = Math.max(save.bestWatch, run.watch);
  save.runs += 1;
  if (run.won) save.wins += 1;
  writeSave(save);
  return record;
}
