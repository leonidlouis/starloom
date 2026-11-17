// Keyboard and mouse. Held keys give movement; presses (keys and clicks) are queued and taken
// once per frame, so a tap between two frames is never lost or counted twice. Mouse positions
// are mapped to the 1280x800 logical sky by the renderer's transform.

const MOVE = {
  KeyW: [0, -1], ArrowUp: [0, -1],
  KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
};
const CLAIMED = new Set(['Space', 'Enter', 'Escape', 'KeyP', 'KeyQ', 'KeyE', 'KeyM', 'ShiftLeft', 'ShiftRight', 'Digit1', 'Digit2', 'Digit3', 'Tab', 'KeyR']);

export function createInput(canvas, toLogical) {
  const held = new Set();
  let presses = [];
  let clicks = [];
  const mouse = { x: 640, y: 360, down: false };

  window.addEventListener('keydown', (e) => {
    if (MOVE[e.code] || CLAIMED.has(e.code)) e.preventDefault();
    held.add(e.code);
    if (!e.repeat) presses.push(e.code);
  });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('pointermove', (e) => {
    const p = toLogical(e.clientX, e.clientY);
    mouse.x = p.x;
    mouse.y = p.y;
  });
  canvas.addEventListener('pointerdown', (e) => {
    const p = toLogical(e.clientX, e.clientY);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.down = true;
    clicks.push({ x: p.x, y: p.y, button: e.button });
  });
  window.addEventListener('pointerup', () => (mouse.down = false));

  return {
    mouse,
    isHeld: (code) => held.has(code),
    move() {
      let x = 0;
      let y = 0;
      for (const code of held) {
        const m = MOVE[code];
        if (m) {
          x += m[0];
          y += m[1];
        }
      }
      return { x: Math.sign(x), y: Math.sign(y) };
    },
    /** Take this frame's key presses (codes) and clicks ({x, y, button}). */
    take() {
      const taken = { presses, clicks };
      presses = [];
      clicks = [];
      return taken;
    },
  };
}
