// Plane geometry the loom needs: distance to a silk segment, whether a point lies inside a
// closed constellation (even-odd, so a crossed shape still works), and a shape's area.

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

/** Distance from point p to the segment a-b. */
export function segmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function pointInPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
    const a = pts[i];
    const b = pts[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function polygonArea(pts) {
  let sum = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) sum += (pts[j].x + pts[i].x) * (pts[j].y - pts[i].y);
  return Math.abs(sum / 2);
}

export function centroid(pts) {
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p.x;
    y += p.y;
  }
  return { x: x / pts.length, y: y / pts.length };
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
