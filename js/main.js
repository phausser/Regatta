// ── Entry point ──────────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');

// 'menu' | 'tutorial' | 'game'
let gameScreen  = 'menu';
let _scoreSaved = false;

// Race transition tracking for one-shot sounds
let _prevWp    = 0;
let _prevPhase = 'pre_start';

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

Input.init();
Input.initMouse(canvas);
Race.init();
Renderer.init();

// Mouse-wheel zoom (works in all screens while in-game)
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
  Camera.zoom = Math.max(0.1, Math.min(5, Camera.zoom * factor));
}, { passive: false });

// ── Transitions ───────────────────────────────────────────────────────────────
function startGame() {
  Race.reset();
  _scoreSaved = false;
  _prevWp     = 0;
  _prevPhase  = 'pre_start';
  UI._newRank = -1;
  gameScreen  = 'game';
}

function startTutorial() {
  Race.reset();
  Tutorial.begin();
  _scoreSaved = false;
  _prevWp     = 0;
  _prevPhase  = 'pre_start';
  gameScreen  = 'tutorial';
}

function goToMenu() {
  gameScreen = 'menu';
}

// ── Game loop ─────────────────────────────────────────────────────────────────
let lastTime = performance.now();
const state  = { fps: 0 };

function loop(timestamp) {
  const dt  = Math.min((timestamp - lastTime) / 1000, 0.1);
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
  Wind.update(dt);

  if (Input.isPressed('KeyM')) Sfx.toggleMute();

  if (gameScreen === 'menu') {
    const action = UI.updateMenu(dt);
    if (action === 'game')     startGame();
    if (action === 'tutorial') startTutorial();
    return;
  }

  // Escape → back to menu (from game or tutorial)
  if (Input.isPressed('Escape')) { goToMenu(); return; }

  // Zoom keys
  const zoomIn  = Input.isDown('Equal') || Input.isDown('BracketRight') || Input.isDown('NumpadAdd');
  const zoomOut = Input.isDown('Minus') || Input.isDown('NumpadSubtract');
  if (zoomIn)  Camera.zoom = Math.min(5,   Camera.zoom * (1 + 1.2 * dt));
  if (zoomOut) Camera.zoom = Math.max(0.1, Camera.zoom / (1 + 1.2 * dt));

  Boat.update(dt, Wind);
  Race.update(dt, Boat);
  Renderer.update(dt, Boat);
  Camera.follow(Boat, dt);
  Sfx.update(Boat, Wind);

  // One-shot sounds on race transitions
  if (Race.wp > _prevWp)                                        Sfx.playBuoyPing();
  if (Race.phase === 'finished' && _prevPhase !== 'finished')   Sfx.playFinish();
  _prevWp    = Race.wp;
  _prevPhase = Race.phase;

  if (gameScreen === 'tutorial') {
    Tutorial.update(dt);
    if (Tutorial.isDone()) {
      gameScreen = 'game';
    }
  }

  // Auto-save score once when race finishes
  if (gameScreen === 'game' && Race.phase === 'finished' && !_scoreSaved) {
    UI.saveScore(Race.raceTime);
    _scoreSaved = true;
  }

  // Reset shortcut (T key)
  if (Input.isPressed('KeyT')) {
    Race.reset();
    _scoreSaved = false;
    _prevWp     = 0;
    _prevPhase  = 'pre_start';
    UI._newRank = -1;
  }
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function draw() {
  if (gameScreen === 'menu') {
    const action = UI.drawMenu(ctx, canvas);
    if (action === 'game')     startGame();
    if (action === 'tutorial') startTutorial();
    return;
  }

  // In-game rendering
  Renderer.drawBackground(ctx, canvas);
  drawWorldBorder();
  Race.draw(ctx, canvas);
  Renderer.drawParticles(ctx, canvas);
  Boat.draw(ctx, canvas);
  Renderer.drawWindCompass(ctx, canvas);
  Debug.draw(ctx, canvas, state);

  if (gameScreen === 'tutorial') {
    Tutorial.draw(ctx, canvas);
  }

  if (gameScreen === 'game' && Race.phase === 'finished') {
    const action = UI.drawFinishOverlay(ctx, canvas);
    if (action === 'restart') startGame();
    if (action === 'menu')    goToMenu();
  }

  // Mute-Indikator (oben links, nur wenn stummgeschaltet)
  if (Sfx.muted) {
    ctx.save();
    ctx.font         = '12px monospace';
    ctx.fillStyle    = 'rgba(255,255,255,0.40)';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('🔇 M', 10, canvas.height - 38);
    ctx.restore();
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
