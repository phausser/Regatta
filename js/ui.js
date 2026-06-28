// UI – Menü, HUD, Finish-Overlay (DOM-basiert)
const UI = {
  _menuSel:      0,
  _newRank:      -1,
  _pending:      null,
  _finishPending: null,

  _SEA:  '#e0eeff',
  _GOLD: '#ffdc50',
  _KEY:  'geosail-scores',

  // ── Highscores ─────────────────────────────────────────────────────────────
  scores() {
    try { return JSON.parse(localStorage.getItem(this._KEY)) || []; }
    catch { return []; }
  },

  saveScore(timeSeconds) {
    const list = this.scores();
    list.push(timeSeconds);
    list.sort((a, b) => a - b);
    const top5 = list.slice(0, 5);
    this._newRank = top5.indexOf(timeSeconds);
    try { localStorage.setItem(this._KEY, JSON.stringify(top5)); } catch {}
    return this._newRank;
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
    const isMenu   = name === 'menu';
    const isFinish = name === 'finish';
    const isGame   = name === 'game' || name === 'tutorial';
    const isTut    = name === 'tutorial';

    this._el('screen-menu').classList.toggle('hidden', !isMenu);
    this._el('screen-finish').classList.toggle('hidden', !isFinish);
    this._el('hud-game').classList.toggle('hidden', !isGame);
    this._el('tutorial-panel').classList.toggle('hidden', !isTut);

    if (isMenu) this._renderMenuScores();
  },

  // ── Menu ───────────────────────────────────────────────────────────────────
  updateMenu() {
    if (Input.isPressed('ArrowUp'))   this._menuSel = Math.max(0, this._menuSel - 1);
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

    const rank    = this._newRank;
    const rankEl  = this._el('finish-rank');
    rankEl.className = '';
    if (rank === 0) {
      rankEl.textContent = 'Neue Bestzeit!';
      rankEl.className   = 'finish-gold';
    } else if (rank > 0) {
      rankEl.textContent = `Platz ${rank + 1} in den Bestzeiten`;
    } else {
      rankEl.textContent = '';
    }

    const sc = this.scores();
    this._el('finish-scores').innerHTML =
      '<div class="scores-label">Bestzeiten</div>' +
      sc.map((t, i) =>
        `<div class="${i === rank ? 'hi' : ''}">${i + 1}. ${this._fmtTime(t)}</div>`
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
    const step  = Math.min(tut._step, tut._steps.length - 1);
    const s     = tut._steps[step];
    const total = tut._steps.length;
    const prog  = Math.min(1, tut._timer / tut._HOLD[step]);

    this._el('tutorial-step').textContent = `Schritt ${step + 1} / ${total}`;

    // Dots
    this._el('tutorial-dots').innerHTML = Array.from({ length: total }, (_, i) =>
      `<span class="tdot${i <= step ? ' done' : ''}"></span>`
    ).join('');

    this._el('tutorial-title').textContent  = s.title;
    this._el('tutorial-hint').textContent   = s.hint;
    this._el('tutorial-metric').textContent = s.metric();
    this._el('tutorial-progress').style.width = `${prog * 100}%`;
  },

  // ── Compass (canvas in HUD) ────────────────────────────────────────────────
  _drawCompass() {
    const canvas = document.getElementById('compass-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const R   = 64;
    const cx  = canvas.width  / 2;
    const cy  = canvas.height / 2 - 14;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(cx, cy, R + 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(5,18,36,0.76)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(224,238,255,0.18)';
    ctx.lineWidth   = 1;
    ctx.stroke();

    ctx.font         = '12px "Roboto Mono", monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = 'rgba(224,238,255,0.48)';
    [['N', 0, -1], ['O', 1, 0], ['S', 0, 1], ['W', -1, 0]].forEach(([l, dx, dy]) => {
      ctx.fillText(l, cx + dx * (R - 9), cy + dy * (R - 9));
    });

    this._compassArrow(ctx, cx, cy, R * 0.90, -Wind.dir, '#1b8cff');
    const awDir = Math.atan2(Boat.awvx, -Boat.awvy);
    this._compassArrow(ctx, cx, cy, R * 0.70, -awDir, '#ff2f2f');

    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font         = '11px "Roboto Mono", monospace';
    ctx.fillStyle    = this._SEA;

    const twFrom = Wind.fromDeg().toFixed(0).padStart(3);
    ctx.fillText(`TW ${twFrom}°  ${Wind.speed.toFixed(0)} kn`, cx - R, cy + R + 18);

    const awaDeg = (Math.abs(Boat.awa) * 180 / Math.PI).toFixed(0).padStart(3);
    const awaDir2 = Boat.awa >= 0 ? 'S' : 'B';
    ctx.fillText(`AW ${awaDeg}°${awaDir2} ${Boat.awSpeed.toFixed(0)} kn`, cx - R, cy + R + 34);
  },

  _compassArrow(ctx, cx, cy, len, dir, color) {
    const tipX  = cx + Math.sin(dir) * len;
    const tipY  = cy - Math.cos(dir) * len;
    const tailX = cx - Math.sin(dir) * len * 0.24;
    const tailY = cy + Math.cos(dir) * len * 0.24;
    const perpX = Math.cos(dir);
    const perpY = Math.sin(dir);
    const halfW = len * 0.11;

    ctx.save();
    ctx.fillStyle    = color;
    ctx.globalAlpha  = 0.88;
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
      racing:    '● RENNEN',
      finished:  '✓ ZIEL!',
    }[Race.phase];
    const faint = 'color:rgba(224,238,255,0.24)';
    const div   = (txt, style = '') => `<div${style ? ` style="${style}"` : ''}>${txt}</div>`;

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
    const good  = Boat.sailState === 'good';
    const text  = { good: 'OK', luffing: 'Luff ↑', overtrimmed: 'Eng ↓' }[Boat.sailState];
    const color = good ? '#44ff88' : '#ff3d4a';
    return `<div style="color:${color}">Segel:  ${text}</div>`;
  },

  _nextLabel() {
    if (Race.wp >= 1 && Race.wp <= Race.marks.length) return `Tonne ${Race.marks[Race.wp - 1].label}`;
    if (Race.wp === Race.marks.length + 1)             return 'ZIEL-Gate';
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
    const sc = this.scores();
    const el = this._el('menu-scores');
    if (sc.length === 0) { el.innerHTML = ''; return; }
    el.innerHTML = '<div class="scores-label">Bestzeiten</div>' +
      sc.map((t, i) =>
        `<div class="${i === 0 ? 'gold' : ''}">${i + 1}. ${this._fmtTime(t)}</div>`
      ).join('');
  },

  _fmtTime(s) {
    const m  = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    const t  = Math.floor((s % 1) * 10);
    return `${m}:${ss.toString().padStart(2, '0')}.${t}`;
  },

  _el(id) { return document.getElementById(id); },
};
