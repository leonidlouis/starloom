// Field callouts: small labelled tags pinned to what matters on the sky right now, read from
// the live world each frame. YOU on the Weaver, the open chain and where to close it, silk a
// hulk is snapping, a gnawer hunting your stars, a lurker about to spit, and the Eclipse's life.
// At most a handful show at once, so the sky stays readable.
import { FONT_UI, PALETTE, VIEW } from './config.js';

function tag(ctx, x, y, text, color, ax = null, ay = null, size = 15, solid = false) {
  ctx.font = `900 ${size}px ${FONT_UI}`;
  const w = ctx.measureText(text).width + 18;
  const h = size + 11;
  // Keep every tag on the open sky: below the top HUD bars, above the loom bar, inside the edges.
  x = Math.max(w / 2 + 6, Math.min(VIEW.width - w / 2 - 6, x));
  y = Math.max(176, Math.min(VIEW.height - 130, y));
  if (ax !== null) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(ax, ay);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fillStyle = solid ? color : 'rgba(8,4,24,0.88)';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = solid ? '#2a1238' : color;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y + size * 0.36);
}

function nearest(list, x, y, filter) {
  let best = null;
  let bd = Infinity;
  for (const s of list) {
    if (s.dead || !filter(s)) continue;
    const d = Math.hypot(s.x - x, s.y - y);
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  return best ? { s: best, d: bd } : null;
}

export function drawCallouts(ctx, world, t) {
  if (world.phase !== 'watch') return;
  const w = world.weaver;
  const stars = world.loom.stars;

  // The open chain: how full the loom is, and where to click to close it.
  if (stars.length >= 2) {
    const last = stars[stars.length - 1];
    tag(ctx, last.x, last.y - 34, `CHAIN ${stars.length}/${world.stats.maxStars}`, PALETTE.silk, last.x, last.y - 8);
  }
  if (stars.length >= 3) {
    const first = stars[0];
    const bob = Math.sin(t * 6) * 2;
    tag(ctx, first.x, first.y + 40 + bob, 'CLOSE HERE: NOVA!', PALETTE.nova, first.x, first.y + 14, 15, true);
  }
  // Silk under strain from a hulk or the Eclipse.
  const strained = stars.find((s) => s.strain > 0);
  if (strained) tag(ctx, strained.x - 70, strained.y + 6, 'SILK SNAPPING!', PALETTE.danger, strained.x - 10, strained.y);

  // One gnawer that is hunting a star, and one lurker about to spit.
  if (stars.length) {
    const g = nearest(world.shadows, stars[stars.length - 1].x, stars[stars.length - 1].y, (s) => s.type === 'gnawer');
    if (g && g.d < 260) tag(ctx, g.s.x, g.s.y - g.s.r - 22, 'STAR EATER', '#ff7a8a', g.s.x, g.s.y - g.s.r);
  }
  const l = nearest(world.shadows, w.x, w.y, (s) => s.type === 'lurker' && s.cooldown < 1.2);
  if (l) tag(ctx, l.s.x, l.s.y - l.s.r - 26, 'SPITTING', '#d68bff', l.s.x, l.s.y - l.s.r);

  if (world.boss && !world.boss.dead) {
    const b = world.boss;
    tag(ctx, b.x, b.y + b.r * 1.9 + 16, `THE ECLIPSE  ${Math.ceil((b.hp / b.maxHp) * 100)}% LIFE`, '#ff7aa2', null, null, 17);
  }
  tag(ctx, w.x, w.y - 34, 'YOU', PALETTE.light, w.x, w.y - 16, 13);
}
