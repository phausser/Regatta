// Tutorial – 4 interactive in-game steps with bottom-panel overlay
const Tutorial = {
  _step:    0,
  _timer:   0,   // how long current done-condition has been met
  _done:    false,

  // Thresholds for "condition held long enough"
  _HOLD: [1.5, 1.0, 0.5, 0.5],

  _steps: [
    {
      title: 'Segel trimmen',
      hint:  '↑ / ↓ – Segel ein- oder ausholen bis es gelb leuchtet',
      metric() { return `Segelstatus: ${Boat.sailState}`; },
      done()   { return Boat.sailState === 'good'; },
    },
    {
      title: 'Fahrt aufnehmen',
      hint:  '← → steuern  ·  Kurs zum Wind finden, bis du > 3,5 kn fährst',
      metric() { return `Fahrt: ${Boat.speed.toFixed(1)} kn`; },
      done()   { return Boat.speed >= 3.5; },
    },
    {
      title: 'Startlinie kreuzen',
      hint:  'Fahre zwischen den roten und grünen Bojen von Süd nach Nord',
      metric() {
        const ph = Race.phase;
        return ph === 'pre_start' ? 'Noch nicht gestartet' : 'Gestartet!';
      },
      done() { return Race.phase === 'racing'; },
    },
    {
      title: 'Erste Tonne runden',
      hint:  'Halte auf Tonne 1 zu und runde sie (Annäherung aus ≥ 2,5× Radius)',
      metric() { return `Wegpunkt: ${Race.wp} / 4`; },
      done()   { return Race.wp >= 2; },
    },
  ],

  begin() {
    this._step  = 0;
    this._timer = 0;
    this._done  = false;
    // Set up for step 0: bad trim so player must fix it
    Boat.trimAngle = 1.40;
  },

  update(dt) {
    if (this._done) return;
    const s = this._steps[this._step];
    if (s.done()) {
      this._timer += dt;
      if (this._timer >= this._HOLD[this._step]) {
        this._step++;
        this._timer = 0;
        if (this._step >= this._steps.length) {
          this._done = true;
        }
      }
    } else {
      this._timer = 0;
    }
  },

  isDone() { return this._done; },

  draw(ctx, canvas) {
    const PANEL_H = 110;
    const py      = canvas.height - PANEL_H;
    const W       = canvas.width;
    const total   = this._steps.length;
    const step    = Math.min(this._step, total - 1);
    const s       = this._steps[step];

    // Panel background
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, py, W, PANEL_H);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();

    // Step dots
    const dotR   = 7;
    const dotY   = py + 20;
    const dotGap = 28;
    const dotX0  = W / 2 - ((total - 1) * dotGap) / 2;
    for (let i = 0; i < total; i++) {
      const dx = dotX0 + i * dotGap;
      ctx.beginPath();
      ctx.arc(dx, dotY, dotR, 0, Math.PI * 2);
      if (i < step)      { ctx.fillStyle = '#00e5ff'; ctx.fill(); }
      else if (i === step) {
        ctx.fillStyle = this._done ? '#00e5ff' : '#ffffff';
        ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.30)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Step label
    ctx.font         = '11px monospace';
    ctx.fillStyle    = 'rgba(255,255,255,0.45)';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Schritt ${step + 1} / ${total}`, W / 2, dotY);

    // Title
    ctx.font      = 'bold 16px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(s.title, W / 2, py + 42);

    // Hint
    ctx.font      = '12px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText(s.hint, W / 2, py + 62);

    // Metric
    ctx.font      = '11px monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(s.metric(), W / 2, py + 80);

    // Progress bar (condition hold timer)
    const holdNeeded = this._HOLD[step];
    const prog       = Math.min(1, this._timer / holdNeeded);
    const barW       = Math.min(320, W * 0.4);
    const barX       = W / 2 - barW / 2;
    const barY       = py + 94;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(barX, barY, barW, 6);
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(barX, barY, barW * prog, 6);

    ctx.restore();
  },
};
