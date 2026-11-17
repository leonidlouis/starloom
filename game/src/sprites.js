// Cached glow sprites: soft radial lights drawn once per colour and size, then stamped with
// additive blending. They are what makes stars, silk, eyes and novas bloom cheaply.

const cache = new Map();

function hexToRgb(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function glowSprite(color, radius) {
  const r = Math.max(2, Math.round(radius));
  const key = `${color}|${r}`;
  let c = cache.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = r * 2;
  const g = c.getContext('2d');
  const [R, G, B] = hexToRgb(color);
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, `rgba(${R},${G},${B},1)`);
  grad.addColorStop(0.18, `rgba(${R},${G},${B},0.55)`);
  grad.addColorStop(0.5, `rgba(${R},${G},${B},0.14)`);
  grad.addColorStop(1, `rgba(${R},${G},${B},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, r * 2, r * 2);
  cache.set(key, c);
  return c;
}

/** Stamp a glow at (x, y); call inside a 'lighter' composite for bloom. */
export function drawGlow(ctx, x, y, color, radius, alpha = 1) {
  const s = glowSprite(color, radius <= 24 ? 24 : radius <= 64 ? 64 : radius <= 160 ? 160 : 320);
  ctx.globalAlpha = alpha;
  ctx.drawImage(s, x - radius, y - radius, radius * 2, radius * 2);
  ctx.globalAlpha = 1;
}

export function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
