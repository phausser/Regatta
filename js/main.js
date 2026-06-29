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
UI.showScreen('menu');

// ── Transitions ───────────────────────────────────────────────────────────────
function startGame() {
  Race.reset();
  ScoreApi.clearSession();
  _scoreSaved = false;
  _prevWp     = 0;
  _prevPhase  = 'pre_start';
  UI._newRank = -1;
  UI._scoreStatus = '';
  gameScreen  = 'game';
  UI.showScreen('game');
}

function startTutorial() {
  Race.reset();
  ScoreApi.clearSession();
  Tutorial.begin();
  _scoreSaved = false;
  _prevWp     = 0;
  _prevPhase  = 'pre_start';
  gameScreen  = 'tutorial';
  UI.showScreen('tutorial');
}

function goToMenu() {
  ScoreApi.clearSession();
  gameScreen = 'menu';
  UI.showScreen('menu');
}

function finishRaceForHighscoreTest() {
  if (gameScreen !== 'game' || Race.phase !== 'racing') return;

  const testTime = Race.raceTime < 181
    ? 181 + Race.raceTime
    : Race.raceTime;

  Race.phase    = 'finished';
  Race.wp       = Race.marks.length + 1;
  Race.raceTime = Math.max(testTime, ScoreApi.sessionAgeSeconds() + 1);
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
  if (zoomIn)  { Scene.zoom = Scene.clampZoom(Scene.zoom * (1 + 1.2 * dt)); Scene.applyFrustum(); }
  if (zoomOut) { Scene.zoom = Scene.clampZoom(Scene.zoom / (1 + 1.2 * dt)); Scene.applyFrustum(); }

  Boat.update(dt, Wind);
  Race.update(dt, Boat);
  Scene.follow(Boat);
  Sfx.update(Boat, Wind);

  // One-shot sounds on race transitions
  if (Race.wp > _prevWp)                                        Sfx.playBuoyPing();
  if (Race.phase === 'racing' && _prevPhase === 'pre_start')     UI.startScoreSession();
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
    UI.showFinish();
    UI.showScreen('finish');
    UI.submitScore(Race.raceTime);
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
    ScoreApi.clearSession();
    _scoreSaved = false;
    _prevWp     = 0;
    _prevPhase  = 'pre_start';
    UI._newRank = -1;
    UI._scoreStatus = '';
  }

  Debug.draw(state);
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function draw() {
  Scene.updateMeshes();
  Scene.render();
}

// ── Start ─────────────────────────────────────────────────────────────────────
requestAnimationFrame(loop);
