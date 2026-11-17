// The eight watches of the night: what each one sends, how fast, and how it ramps toward its end.
// A watch lasts until its dawn bell; the eighth lasts until the Eclipse falls.
import { VIEW } from './config.js';

/** Each spawn line: shadow type, first second, seconds between groups, group size. */
export const WATCHES = [
  { title: 'First Watch', omen: 'Wisps gather at the edge of the sky.', duration: 34, spawns: [['wisp', 1, 1.5, 3]] },
  { title: 'Second Watch', omen: 'Flitters weave in among the wisps.', duration: 40, spawns: [['wisp', 1, 1.6, 4], ['flitter', 6, 3.2, 2]] },
  { title: 'Third Watch', omen: 'Gnawers hunger for your stars.', duration: 44, spawns: [['wisp', 1, 1.6, 4], ['flitter', 4, 3.4, 2], ['gnawer', 8, 5, 2]] },
  { title: 'Fourth Watch', omen: 'An Umbral Hulk lumbers through the silk.', duration: 46, spawns: [['wisp', 1, 1.4, 4], ['gnawer', 6, 5.5, 2], ['hulk', 10, 14, 1], ['flitter', 3, 3, 2]] },
  { title: 'Fifth Watch', omen: 'Lurkers keep their distance and spit.', duration: 48, spawns: [['wisp', 1, 1.3, 5], ['lurker', 5, 6, 2], ['flitter', 3, 3, 3], ['hulk', 18, 16, 1]] },
  { title: 'Sixth Watch', omen: 'Mires burst into swarms when broken.', duration: 50, spawns: [['wisp', 1, 1.4, 5], ['mire', 4, 6, 2], ['gnawer', 6, 5, 2], ['lurker', 10, 7, 2], ['hulk', 14, 13, 1]] },
  { title: 'Seventh Watch', omen: 'Every shadow at once. Hold the loom.', duration: 54, spawns: [['wisp', 1, 1.1, 6], ['flitter', 2, 2.6, 3], ['gnawer', 5, 4.5, 2], ['mire', 7, 6, 2], ['lurker', 9, 6, 2], ['hulk', 10, 11, 1]] },
  { title: 'Last Watch', omen: 'The Eclipse rises. Bind it in light.', duration: 0, boss: 'eclipse', spawns: [['wisp', 3, 2.2, 5], ['flitter', 8, 5, 2], ['gnawer', 12, 8, 2]] },
];

/** A spawn point just outside the sky's edge: mostly top and sides, rarely from below. */
export function edgePoint(rng) {
  const side = rng.next();
  const m = 40;
  if (side < 0.4) return { x: rng.range(0, VIEW.width), y: -m };
  if (side < 0.7) return { x: -m, y: rng.range(0, VIEW.horizon - 80) };
  if (side < 0.95) return { x: VIEW.width + m, y: rng.range(0, VIEW.horizon - 80) };
  return { x: rng.range(100, VIEW.width - 100), y: VIEW.height + m };
}

/** A spawn director for one watch: call tick(dt) each step, it calls spawn(type, x, y) as due. */
export function createDirector(watchIndex, rng, spawn) {
  const watch = WATCHES[watchIndex];
  const clocks = watch.spawns.map(([, first]) => first);
  let time = 0;
  return {
    watch,
    tick(dt) {
      time += dt;
      const progress = watch.duration > 0 ? Math.min(1, time / watch.duration) : Math.min(1, time / 90);
      const pace = 1 - 0.45 * progress;
      if (watch.duration > 0 && time > watch.duration - 3) return;
      watch.spawns.forEach(([type, , every, size], i) => {
        if (time < clocks[i]) return;
        clocks[i] = time + every * pace * rng.range(0.85, 1.15);
        const origin = edgePoint(rng);
        const count = size + (progress > 0.6 ? 1 : 0);
        for (let k = 0; k < count; k += 1) spawn(type, origin.x + rng.range(-40, 40), origin.y + rng.range(-40, 40));
      });
    },
  };
}
