// ── Entry point ──────────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');

const state = { fps: 0 };

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

Input.init();
Race.init();
Renderer.init();

// Mausrad-Zoom (zuverlässig auf allen Tastaturen)
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
  Camera.zoom = Math.max(0.1, Math.min(5, Camera.zoom * factor));
}, { passive: false });

// ── Game loop ─────────────────────────────────────────────────────────────────
let lastTime = performance.now();

function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime  = timestamp;
  state.fps = 1 / dt;

  update(dt);
  draw();

  Input.flush();
  requestAnimationFrame(loop);
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  Debug.update();

  // Zoom: kontinuierlich während Taste gehalten
  // Equal=US+, BracketRight=DE+, NumpadAdd; Minus=US-/DE-, NumpadSubtract
  const zoomIn  = Input.isDown('Equal') || Input.isDown('BracketRight') || Input.isDown('NumpadAdd');
  const zoomOut = Input.isDown('Minus') || Input.isDown('NumpadSubtract');
  if (zoomIn)  Camera.zoom = Math.min(5,   Camera.zoom * (1 + 1.2 * dt));
  if (zoomOut) Camera.zoom = Math.max(0.1, Camera.zoom / (1 + 1.2 * dt));

  Wind.update(dt);
  Boat.update(dt, Wind);
  Race.update(dt, Boat);
  Renderer.update(dt, Boat);
  Camera.follow(Boat, dt);
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function draw() {
  Renderer.drawBackground(ctx, canvas);
  drawWorldBorder();

  Race.draw(ctx, canvas);
  Renderer.drawParticles(ctx, canvas);
  Boat.draw(ctx, canvas);
  Renderer.drawWindCompass(ctx, canvas);

  Debug.draw(ctx, canvas, state);
}

// Dashed world boundary (5000 × 5000)
function drawWorldBorder() {
  const corners = [[0,0],[5000,0],[5000,5000],[0,5000]].map(([wx,wy]) => Camera.toScreen(wx, wy, canvas));
  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  corners.slice(1).forEach(c => ctx.lineTo(c.x, c.y));
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// ── Start ─────────────────────────────────────────────────────────────────────
requestAnimationFrame(loop);
