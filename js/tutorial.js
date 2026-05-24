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

    const SEA       = '#083478';
    const SEA_MID   = 'rgba(8,52,120,0.55)';
    const SEA_FAINT = 'rgba(8,52,120,0.28)';

    // Panel background – weiß
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.fillRect(0, py, W, PANEL_H);

    // Step label
    ctx.font         = '11px "Roboto Mono", monospace';
    ctx.fillStyle    = SEA_MID;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Schritt ${step + 1} / ${total}`, W / 2, py + 11);

    // Step dots
    const dotR   = 6;
    const dotY   = py + 26;
    const dotGap = 26;
    const dotX0  = W / 2 - ((total - 1) * dotGap) / 2;
    for (let i = 0; i < total; i++) {
      const dx = dotX0 + i * dotGap;
      ctx.beginPath();
      ctx.arc(dx, dotY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = (i <= step) ? SEA : SEA_FAINT;
      ctx.fill();
    }

    // Title
    ctx.font      = 'bold 16px Roboto, sans-serif';
    ctx.fillStyle = SEA;
    ctx.fillText(s.title, W / 2, py + 42);

    // Hint
    ctx.font      = '12px "Roboto Mono", monospace';
    ctx.fillStyle = SEA_MID;
    ctx.fillText(s.hint, W / 2, py + 62);

    // Metric
    ctx.font      = '11px "Roboto Mono", monospace';
    ctx.fillStyle = SEA;
    ctx.fillText(s.metric(), W / 2, py + 80);

    // Progress bar
    const holdNeeded = this._HOLD[step];
    const prog       = Math.min(1, this._timer / holdNeeded);
    const barW       = Math.min(320, W * 0.4);
    const barX       = W / 2 - barW / 2;
    const barY       = py + 94;
    ctx.fillStyle = SEA_FAINT;
    ctx.fillRect(barX, barY, barW, 6);
    ctx.fillStyle = SEA;
    ctx.fillRect(barX, barY, barW * prog, 6);

    ctx.restore();
  },
};
