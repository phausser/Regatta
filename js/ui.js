// UI – Menü, HUD, Finish-Overlay (DOM-basiert)
const UI = {
  _menuSel: 0,
  _newRank: -1,
  _pending: null,
  _finishPending: null,
  _serverScores: null,
  _scoreStatus: '',
  _scoresLoaded: false,
  _scoresError: false,

  _SEA: '#e0eeff',
  _GOLD: '#ffdc50',

  // ── Highscores ─────────────────────────────────────────────────────────────
  startScoreSession() {
    this._scoreStatus = '';
    ScoreApi.startSession().catch((err) => {
      this._logScoreError('Score-Session konnte nicht gestartet werden', err);
      ScoreApi.clearSession();
      this._scoreStatus = 'Server nicht erreichbar';
    });
  },

  async submitScore(timeSeconds) {
    const playername = this.requestPlayerName();
    this._scoreStatus = 'Wird gespeichert';
    this.showFinish();

    try {
      await ScoreApi.submitScore(timeSeconds, playername);
      this._scoreStatus = 'Online gespeichert';
    } catch (err) {
      this._logScoreError('Score konnte nicht gespeichert werden', err, {
        playername,
        timeSeconds,
      });
      this._scoreStatus = this._scoreErrorLabel(err);
      this._newRank = -1;
      this.showFinish();
      return;
    }

    try {
      await this.refreshScores();
      this._newRank = this._rankForTime(timeSeconds, this._serverScores);
    } catch (err) {
      console.warn('[GeoSail] Score gespeichert, aber Bestenliste konnte nicht aktualisiert werden', err);
      this._newRank = -1;
    }
    this.showFinish();
  },

  _logScoreError(label, err, context = {}) {
    console.error(`[GeoSail] ${label}`, {
      ...context,
      ...ScoreApi._requestDetails(err),
    });
  },

  _scoreErrorLabel(err) {
    const message = err && err.message ? err.message : '';
    if (message === 'Score time shorter than session age') return 'Speichern zu spaet bestaetigt';
    if (message === 'Implausible time') return 'Zeit nicht plausibel';
    if (message === 'Session expired') return 'Score-Session abgelaufen';
    if (message === 'Invalid session' || message === 'No score session') return 'Keine gueltige Score-Session';
    if (message === 'Validation failed') return 'Score-Validierung fehlgeschlagen';
    return 'Server nicht erreichbar';
  },

  requestPlayerName() {
    const name = window.prompt('Name fuer die Bestenliste:', 'Anonymous');
    return ScoreApi.playerName(name);
  },

  async refreshScores() {
    this._scoresError = false;
    try {
      this._serverScores = await ScoreApi.leaderboard(5);
    } catch (err) {
      this._serverScores = [];
      this._scoresError = true;
    }
    this._scoresLoaded = true;
  },

  // ── Init ───────────────────────────────────────────────────────────────────
  init() {
    document.getElementById('btn-race').addEventListener('click', () => {
      this._pending = 'game';
    });
    document.getElementById('btn-tutorial').addEventListener('click', () => {
      this._pending = 'tutorial';
    });
    document.getElementById('btn-restart').addEventListener('click', () => {
      this._finishPending = 'restart';
    });
    document.getElementById('btn-back-menu').addEventListener('click', () => {
      this._finishPending = 'menu';
    });
  },

  // ── Screen switching ────────────────────────────────────────────────────────
  showScreen(name) {
    const isMenu = name === 'menu';
    const isFinish = name === 'finish';
    const isGame = name === 'game' || name === 'tutorial';
    const isTut = name === 'tutorial';

    this._el('screen-menu').classList.toggle('hidden', !isMenu);
    this._el('screen-finish').classList.toggle('hidden', !isFinish);
    this._el('hud-game').classList.toggle('hidden', !isGame);
    this._el('tutorial-panel').classList.toggle('hidden', !isTut);

    if (isMenu) {
      this._renderMenuScores();
      this.refreshScores().then(() => this._renderMenuScores());
    }
  },

  // ── Menu ───────────────────────────────────────────────────────────────────
  updateMenu() {
    if (Input.isPressed('ArrowUp')) this._menuSel = Math.max(0, this._menuSel - 1);
    if (Input.isPressed('ArrowDown')) this._menuSel = Math.min(1, this._menuSel + 1);

    document.querySelectorAll('.menu-btn').forEach((b, i) => {
      b.classList.toggle('active', i === this._menuSel);
    });

    if (Input.isPressed('Enter') || Input.isPressed('Space')) {
      this._pending = this._menuSel === 0 ? 'game' : 'tutorial';
    }

    const action = this._pending;
    this._pending = null;
    return action;
  },

  // ── In-game HUD ─────────────────────────────────────────────────────────────
  updateHUD() {
    this._el('race-hud').innerHTML = this._raceHudHTML();
    this._el('mute-indicator').classList.toggle('hidden', !Sfx.muted);
    this._drawCompass();
  },

  // ── Finish overlay ─────────────────────────────────────────────────────────
  showFinish() {
    this._el('finish-time').textContent = this._fmtTime(Race.raceTime);

    const rank = this._newRank;
    const rankEl = this._el('finish-rank');
    rankEl.className = '';
    if (rank === 0) {
      rankEl.textContent = 'Neue Bestzeit!';
      rankEl.className = 'finish-gold';
    } else if (rank > 0) {
      rankEl.textContent = `Platz ${rank + 1} in den Bestzeiten`;
    } else {
      rankEl.textContent = '';
    }

    const sc = this._serverScores || [];
    const scoreStatus = this._scoreStatus
      ? `<div class="scores-label">${this._scoreStatus}</div>`
      : '';
    this._el('finish-scores').innerHTML =
      scoreStatus +
      '<div class="scores-label">Bestzeiten</div>' +
      sc.map((score, i) =>
        `<div class="${i === rank ? 'hi' : ''}">${i + 1}. ${this._scoreLabel(score)}</div>`
      ).join('');
  },

  updateFinishOverlay() {
    const action = this._finishPending;
    this._finishPending = null;
    return action;
  },

  // ── Tutorial panel ─────────────────────────────────────────────────────────
  updateTutorial(tut) {
    if (tut.isDone()) return;
    const step = Math.min(tut._step, tut._steps.length - 1);
    const s = tut._steps[step];
    const total = tut._steps.length;
    const prog = Math.min(1, tut._timer / tut._HOLD[step]);

    this._el('tutorial-step').textContent = `Schritt ${step + 1} / ${total}`;

    // Dots
    this._el('tutorial-dots').innerHTML = Array.from({ length: total }, (_, i) =>
      `<span class="tdot${i <= step ? ' done' : ''}"></span>`
    ).join('');

    this._el('tutorial-title').textContent = s.title;
    this._el('tutorial-hint').textContent = s.hint;
    this._el('tutorial-metric').textContent = s.metric();
    this._el('tutorial-progress').style.width = `${prog * 100}%`;
  },

  // ── Compass (canvas in HUD) ────────────────────────────────────────────────
  _drawCompass() {
    const canvas = document.getElementById('compass-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const R = 64;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2 - 14;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(cx, cy, R + 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(5,18,36,0.76)';
    ctx.fill();

    ctx.font = '18überpx "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(224,238,255,0.2)';
    [['N', 0, -1], ['O', 1, 0], ['S', 0, 1], ['W', -1, 0]].forEach(([l, dx, dy]) => {
      ctx.fillText(l, cx + dx * (R - 10), cy + dy * (R - 10));
    });

    this._compassArrow(ctx, cx, cy, R * 0.9, Wind.dir + Math.PI, '#3388ff');
    const awDir = Math.atan2(Boat.awvx, -Boat.awvy);
    this._compassArrow(ctx, cx, cy, R * 0.8, awDir + Math.PI, '#ff0066');
  },

  _compassArrow(ctx, cx, cy, len, dir, color) {
    const tipX = cx + Math.sin(dir) * len;
    const tipY = cy - Math.cos(dir) * len;
    const tailX = cx - Math.sin(dir) * len * 0.24;
    const tailY = cy + Math.cos(dir) * len * 0.24;
    const perpX = Math.cos(dir);
    const perpY = Math.sin(dir);
    const halfW = len * 0.11;

    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tailX + perpX * halfW, tailY + perpY * halfW);
    ctx.lineTo(tailX - perpX * halfW, tailY - perpY * halfW);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  // ── Helpers ────────────────────────────────────────────────────────────────
  _raceHudHTML() {
    const phaseLabel = {
      pre_start: 'PRE-START',
      racing: '● RENNEN',
      finished: '✓ ZIEL!',
    }[Race.phase];
    const faint = 'color:rgba(224,238,255,0.24)';
    const div = (txt, style = '') =>
      '<div' + (style ? ' style="' + style + '"' : '') + '>' + txt + '</div>';

    let h = div(phaseLabel);
    h += div('──────────────────', faint);
    if (Race.phase !== 'pre_start') h += div(`Zeit:   ${Race._fmtTime(Race.raceTime)}`);
    h += div(`Speed:  ${Boat.speed.toFixed(1)} kn`);
    h += this._sailHudHTML();
    h += div(`Gesamt: ${(Race.distance / 1852).toFixed(2)} nM`);

    if (Race.phase === 'racing') {
      h += div('──────────────────', faint);
      h += div(`Nächste: ${this._nextLabel()}`);
      h += div(`Dist:    ${this._nextDist().toFixed(0)} m`);
    }
    if (Race.phase === 'pre_start') {
      h += div('──────────────────', faint);
      h += div('Startlinie kreuzen', 'color:rgba(224,238,255,0.58)');
    }
    return h;
  },

  _sailHudHTML() {
    const good = Boat.sailState === 'good';
    const text = { good: 'OK', luffing: 'Luff ↑', overtrimmed: 'Eng ↓' }[Boat.sailState];
    const color = good ? '#44ff88' : '#ff3d4a';
    return `<div style="color:${color}">Segel:  ${text}</div>`;
  },

  _nextLabel() {
    if (Race.wp >= 1 && Race.wp <= Race.marks.length) return `Tonne ${Race.marks[Race.wp - 1].label}`;
    if (Race.wp === Race.marks.length + 1) return 'ZIEL-Gate';
    return '—';
  },

  _nextDist() {
    if (Race.wp >= 1 && Race.wp <= Race.marks.length) {
      const m = Race.marks[Race.wp - 1];
      return Math.hypot(Boat.x - m.x, Boat.y - m.y);
    }
    if (Race.wp === Race.marks.length + 1) {
      const mx = (Race.gate.port.x + Race.gate.stbd.x) / 2;
      return Math.hypot(Boat.x - mx, Boat.y - Race.gate.port.y);
    }
    return 0;
  },

  _renderMenuScores() {
    const sc = this._serverScores || [];
    const el = this._el('menu-scores');
    if (!this._scoresLoaded) {
      el.innerHTML = '<div class="scores-label">Lade Bestzeiten</div>';
      return;
    }
    if (this._scoresError) {
      el.innerHTML = '<div class="scores-label">Server nicht erreichbar</div>';
      return;
    }
    if (sc.length === 0) {
      el.innerHTML = '<div class="scores-label">Keine Server-Bestzeiten</div>';
      return;
    }
    el.innerHTML = '<div class="scores-label">Bestzeiten</div>' +
      sc.map((score, i) =>
        `<div class="${i === 0 ? 'gold' : ''}">${i + 1}. ${this._scoreLabel(score)}</div>`
      ).join('');
  },

  _scoreLabel(score) {
    const name = score.playername && score.playername !== 'Anonymous'
      ? `${score.playername} · `
      : '';
    return `${name}${this._fmtTime(Number(score.time))}`;
  },

  _rankForTime(timeSeconds, scores) {
    const idx = scores.findIndex(score => Math.abs(Number(score.time) - timeSeconds) < 0.01);
    return idx >= 0 ? idx : -1;
  },

  _fmtTime(s) {
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    const t = Math.floor((s % 1) * 10);
    return `${m}:${ss.toString().padStart(2, '0')}.${t}`;
  },

  _el(id) { return document.getElementById(id); },
};
