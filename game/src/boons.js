// Boons: the upgrades offered at the end of each watch. Three are dealt, the player keeps one;
// each can be taken up to its max level, and they reshape the loom, the bolts or the Weaver.
import { LOOM, WEAVER } from './config.js';

export const BOONS = [
  { id: 'wider', name: 'Wider Loom', glyph: 'loom', max: 3, text: '+1 star per constellation. Bigger shapes, bigger novas.' },
  { id: 'reach', name: 'Long Reach', glyph: 'reach', max: 3, text: '+70 reach: place stars farther from the Weaver.' },
  { id: 'searing', name: 'Searing Silk', glyph: 'silk', max: 3, text: 'Threads burn shadows 50% hotter.' },
  { id: 'supernova', name: 'Supernova', glyph: 'nova', max: 3, text: 'Novas deal 40% more damage.' },
  { id: 'tithe', name: 'Stardust Tithe', glyph: 'dust', max: 3, text: 'Stardust flows back 60% faster.' },
  { id: 'thrift', name: 'Tight Weave', glyph: 'thrift', max: 2, text: 'Stars cost 25% less stardust.' },
  { id: 'twin', name: 'Twin Bolts', glyph: 'twin', max: 3, text: 'The Weaver fires one more starbolt each volley.' },
  { id: 'quick', name: 'Quickened Aim', glyph: 'quick', max: 3, text: 'Starbolts fire 30% faster and fly farther.' },
  { id: 'comet', name: 'Comet Heart', glyph: 'comet', max: 2, text: 'Dash recharges 35% sooner and scorches what it passes.' },
  { id: 'afterglow', name: 'Afterglow', glyph: 'glow', max: 2, text: 'A closed shape keeps burning inside for 3 seconds.' },
  { id: 'echo', name: 'Echo Nova', glyph: 'echo', max: 2, text: 'Every nova rings again a moment later at half power.' },
  { id: 'frost', name: 'Rime Silk', glyph: 'frost', max: 2, text: 'Threads hold shadows: they slow far more.' },
  { id: 'lodestar', name: 'Lodestar', glyph: 'magnet', max: 2, text: 'Pull stardust from twice as far away.' },
  { id: 'mend', name: 'Ember Mend', glyph: 'mend', max: 4, text: 'Restore 40 light and raise max light by 20.' },
];

export function boonById(id) {
  return BOONS.find((b) => b.id === id);
}

/** The run's live numbers, derived from the base tuning and the boons taken so far. */
export function deriveStats(levels) {
  const lv = (id) => levels[id] ?? 0;
  return {
    maxStars: LOOM.maxStars + lv('wider'),
    reach: WEAVER.reach + 70 * lv('reach'),
    threadDps: LOOM.threadDps * (1 + 0.5 * lv('searing')),
    novaMult: 1 + 0.4 * lv('supernova'),
    dustRegen: LOOM.dustRegen * (1 + 0.6 * lv('tithe')),
    starCost: LOOM.starCost * (1 - 0.25 * lv('thrift')),
    bolts: 1 + lv('twin'),
    boltCooldown: WEAVER.boltCooldown / (1 + 0.3 * lv('quick')),
    boltRange: WEAVER.boltRange + 50 * lv('quick'),
    dashCooldown: WEAVER.dashCooldown * (1 - 0.35 * lv('comet')),
    dashBurn: lv('comet') > 0 ? 30 + 20 * lv('comet') : 0,
    afterglow: lv('afterglow') > 0 ? 1.5 + 1.5 * lv('afterglow') : 0,
    echo: lv('echo') > 0 ? 0.35 + 0.15 * lv('echo') : 0,
    slow: Math.min(0.85, LOOM.threadSlow + 0.2 * lv('frost')),
    magnet: WEAVER.magnet * (1 + lv('lodestar')),
    maxLight: WEAVER.light + 20 * lv('mend'),
  };
}

/** Deal three different boons the run can still take, weighted away from ones already maxed. */
export function dealBoons(rng, levels) {
  const open = BOONS.filter((b) => (levels[b.id] ?? 0) < b.max);
  const hand = [];
  while (hand.length < 3 && open.length > 0) {
    const i = Math.floor(rng.next() * open.length);
    hand.push(open[i].id);
    open.splice(i, 1);
  }
  return hand;
}
