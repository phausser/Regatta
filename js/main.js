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

  // Zoom: +/- (or =/- on US keyboard)
  if (Input.isPressed('Equal')) Camera.zoom = Math.min(5,   Camera.zoom * 1.25);
  if (Input.isPressed('Minus')) Camera.zoom = Math.max(0.1, Camera.zoom / 1.25);

  Wind.update(dt);
  Boat.update(dt, Wind);
  Camera.follow(Boat, dt);
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function draw() {
  ctx.fillStyle = '#0a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawWorldBorder();

  Boat.draw(ctx, canvas);

  Debug.draw(ctx, canvas, state);
}

function drawGrid() {
  const GRID = 500;
  const tl   = Camera.toWorld(0, 0, canvas);
  const br   = Camera.toWorld(canvas.width, canvas.height, canvas);

  const x0 = Math.floor(tl.x / GRID) * GRID;
  const y0 = Math.floor(tl.y / GRID) * GRID;

  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth   = 1;

  for (let wx = x0; wx <= br.x + GRID; wx += GRID) {
    const s = Camera.toScreen(wx, 0, canvas);
    ctx.beginPath(); ctx.moveTo(s.x, 0); ctx.lineTo(s.x, canvas.height); ctx.stroke();
  }
  for (let wy = y0; wy <= br.y + GRID; wy += GRID) {
    const s = Camera.toScreen(0, wy, canvas);
    ctx.beginPath(); ctx.moveTo(0, s.y); ctx.lineTo(canvas.width, s.y); ctx.stroke();
  }
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
