// Boon glyphs: small gold line-icons drawn with paths, used on boon cards and in the HUD.
import { PALETTE } from './config.js';
import { drawGlow } from './sprites.js';

function star(ctx, x, y, r) {
  ctx.beginPath();
  for (let k = 0; k < 8; k += 1) {
    const rr = k % 2 ? r * 0.38 : r;
    const a = (k / 8) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

const GLYPHS = {
  loom(ctx, s) {
    const pts = [[-1, 0.6], [-0.3, -0.9], [0.9, -0.4], [0.7, 0.8]];
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s)));
    ctx.closePath();
    ctx.stroke();
    pts.forEach(([x, y]) => star(ctx, x * s, y * s, s * 0.32));
  },
  reach(ctx, s) {
    ctx.beginPath();
    ctx.arc(0, 0, s, 0, Math.PI * 2);
    ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(s * 0.8, -s * 0.6);
    ctx.stroke();
    star(ctx, s * 0.8, -s * 0.6, s * 0.35);
    star(ctx, 0, 0, s * 0.25);
  },
  silk(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.5);
    ctx.quadraticCurveTo(0, -s * 1.2, s, s * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, s * 0.6);
    ctx.quadraticCurveTo(0, -s * 0.2, s * 0.3, s * 0.6);
    ctx.quadraticCurveTo(0, s * 0.1, -s * 0.3, s * 0.6);
    ctx.fill();
  },
  nova(ctx, s) {
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * s * 0.45, Math.sin(a) * s * 0.45);
      ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      ctx.stroke();
    }
    star(ctx, 0, 0, s * 0.45);
  },
  dust(ctx, s) {
    for (const [x, y, r] of [[-0.5, 0.3, 0.3], [0.4, -0.4, 0.38], [0.5, 0.6, 0.22], [-0.3, -0.6, 0.2]]) star(ctx, x * s, y * s, r * s * 1.4);
  },
  thrift(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(-s, -s * 0.5);
    ctx.lineTo(s, -s * 0.5);
    ctx.moveTo(-s, 0);
    ctx.lineTo(s, 0);
    ctx.moveTo(-s, s * 0.5);
    ctx.lineTo(s, s * 0.5);
    ctx.moveTo(-s * 0.5, -s);
    ctx.lineTo(-s * 0.5, s);
    ctx.moveTo(s * 0.5, -s);
    ctx.lineTo(s * 0.5, s);
    ctx.stroke();
  },
  twin(ctx, s) {
    for (const off of [-0.35, 0.35]) {
      ctx.beginPath();
      ctx.moveTo(-s, off * s + s * 0.3);
      ctx.lineTo(s * 0.6, off * s - s * 0.3);
      ctx.stroke();
      star(ctx, s * 0.6, off * s - s * 0.3, s * 0.3);
    }
  },
  quick(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(s * 0.2, -s);
    ctx.lineTo(-s * 0.5, s * 0.1);
    ctx.lineTo(s * 0.1, s * 0.1);
    ctx.lineTo(-s * 0.2, s);
    ctx.lineTo(s * 0.6, -s * 0.2);
    ctx.lineTo(0, -s * 0.2);
    ctx.closePath();
    ctx.fill();
  },
  comet(ctx, s) {
    ctx.beginPath();
    ctx.arc(s * 0.45, -s * 0.45, s * 0.38, 0, Math.PI * 2);
    ctx.fill();
    for (const o of [-0.25, 0, 0.25]) {
      ctx.beginPath();
      ctx.moveTo(s * 0.2 + o * s, -s * 0.2 + o * s);
      ctx.lineTo(-s + o * s * 0.5, s - o * s * 0.5);
      ctx.stroke();
    }
  },
  glow(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.9, s * 0.7);
    ctx.lineTo(-s * 0.9, s * 0.7);
    ctx.closePath();
    ctx.globalAlpha = 0.45;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();
  },
  echo(ctx, s) {
    for (const r of [0.35, 0.65, 0.95]) {
      ctx.beginPath();
      ctx.arc(0, 0, r * s, -Math.PI * 0.8, Math.PI * 0.8);
      ctx.stroke();
    }
    star(ctx, 0, 0, s * 0.22);
  },
  frost(ctx, s) {
    for (let i = 0; i < 3; i += 1) {
      const a = (i / 3) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * s, Math.sin(a) * s);
      ctx.lineTo(-Math.cos(a) * s, -Math.sin(a) * s);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
    ctx.stroke();
  },
  magnet(ctx, s) {
    ctx.lineWidth = s * 0.32;
    ctx.beginPath();
    ctx.arc(0, -s * 0.1, s * 0.65, Math.PI, 0);
    ctx.lineTo(s * 0.65, s * 0.8);
    ctx.moveTo(-s * 0.65, -s * 0.1);
    ctx.lineTo(-s * 0.65, s * 0.8);
    ctx.stroke();
  },
  mend(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.9);
    ctx.bezierCurveTo(-s * 1.3, -s * 0.1, -s * 0.5, -s * 1.1, 0, -s * 0.35);
    ctx.bezierCurveTo(s * 0.5, -s * 1.1, s * 1.3, -s * 0.1, 0, s * 0.9);
    ctx.fill();
  },
};

export function drawGlyph(ctx, name, x, y, size, color = PALETTE.silk) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  drawGlow(ctx, x, y, color, size * 2.2, 0.35);
  ctx.globalCompositeOperation = 'source-over';
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.4, size * 0.13);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  (GLYPHS[name] ?? GLYPHS.nova)(ctx, size);
  ctx.restore();
}
