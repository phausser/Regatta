// ── Entry point ──────────────────────────────────────────────────────────────
// 'menu' | 'tutorial' | 'game'
let gameScreen  = 'menu';
let _scoreSaved = false;

let _prevWp    = 0;
let _prevPhase = 'pre_start';

Input.init();
Race.init();
Scene.init();
Input.initMouse(Scene._renderer.domElement);
UI.init();

// ── Transitions ───────────────────────────────────────────────────────────────
function startGame() {
  Race.reset();
  _scoreSaved = false;
  _prevWp     = 0;
  _prevPhase  = 'pre_start';
  UI._newRank = -1;
  gameScreen  = 'game';
  UI.showScreen('game');
}

function startTutorial() {
  Race.reset();
  Tutorial.begin();
  _scoreSaved = false;
  _prevWp     = 0;
  _prevPhase  = 'pre_start';
  gameScreen  = 'tutorial';
  UI.showScreen('tutorial');
}

function goToMenu() {
  gameScreen = 'menu';
  UI.showScreen('menu');
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
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  Debug.update();
  Wind.update(dt);
  WaterMesh.update(dt);

  if (Input.isPressed('KeyM')) Sfx.toggleMute();

  if (gameScreen === 'menu') {
    const action = UI.updateMenu(dt);
    if (action === 'game')     startGame();
    if (action === 'tutorial') startTutorial();
    return;
  }

  if (Input.isPressed('Escape')) { goToMenu(); return; }

  // Zoom keys
  const zoomIn  = Input.isDown('Equal') || Input.isDown('BracketRight') || Input.isDown('NumpadAdd');
  const zoomOut = Input.isDown('Minus') || Input.isDown('NumpadSubtract');
  if (zoomIn)  { Scene.zoom = Math.min(5,   Scene.zoom * (1 + 1.2 * dt)); Scene.applyFrustum(); }
  if (zoomOut) { Scene.zoom = Math.max(0.1, Scene.zoom / (1 + 1.2 * dt)); Scene.applyFrustum(); }

  Boat.update(dt, Wind);
  Race.update(dt, Boat);
  Scene.follow(Boat);
  Sfx.update(Boat, Wind);

  // One-shot sounds on race transitions
  if (Race.wp > _prevWp)                                        Sfx.playBuoyPing();
  if (Race.phase === 'finished' && _prevPhase !== 'finished')   Sfx.playFinish();
  _prevWp    = Race.wp;
  _prevPhase = Race.phase;

  if (gameScreen === 'tutorial') {
    Tutorial.update(dt);
    UI.updateTutorial(Tutorial);
    if (Tutorial.isDone()) {
      gameScreen = 'game';
      UI.showScreen('game');
    }
  }

  if (gameScreen === 'game' && Race.phase === 'finished' && !_scoreSaved) {
    UI.saveScore(Race.raceTime);
    UI.showFinish();
    UI.showScreen('finish');
    _scoreSaved = true;
  }

  if (Race.phase === 'finished') {
    const action = UI.updateFinishOverlay();
    if (action === 'restart') startGame();
    if (action === 'menu')    goToMenu();
  }

  UI.updateHUD();

  if (Input.isPressed('KeyT')) {
    Race.reset();
    _scoreSaved = false;
    _prevWp     = 0;
    _prevPhase  = 'pre_start';
    UI._newRank = -1;
  }

  Debug.draw(state);
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function draw() {
  Scene.updateMeshes();
  Scene.render();
}

// ── Start ─────────────────────────────────────────────────────────────────────
Scene._renderer.setAnimationLoop(loop);
