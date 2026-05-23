// Race – course definition, waypoint logic, timing, HUD
const Race = {

  // ── Kursdefinition ─────────────────────────────────────────────────────────
  gate: {
    port: { x: 2100, y: 2600, color: '#ff4455' },   // rotes Kommitee-Schiff
    stbd: { x: 2900, y: 2600, color: '#44ee88' },   // grüne Pin-Boje
  },

  // Tonnen in Reihenfolge; boot muss auf < radius kommen (mit Approach-Check)
  marks: [],  // wird in init() befüllt (damit reset() sauber funktioniert)

  // ── Renn-Zustand ───────────────────────────────────────────────────────────
  phase:    'pre_start',   // 'pre_start' | 'racing' | 'finished'
  wp:       0,             // nächster Wegpunkt: 0=Start, 1-3=Tonnen, 4=Ziel
  raceTime: 0,
  distance: 0,             // zurückgelegte Strecke in Welt-Einheiten

  _lastBX:       2500,
  _lastBY:       2800,
  _lastGateSide: null,

  // ── Init / Reset ───────────────────────────────────────────────────────────
  init() {
    this.marks = [
      { x: 1600, y: 1100, radius: 90, color: '#ff8800', label: '1', approached: false, rounded: false },
      { x: 3800, y: 1300, radius: 90, color: '#ffcc00', label: '2', approached: false, rounded: false },
      { x: 2500, y: 3200, radius: 90, color: '#ff8800', label: '3', approached: false, rounded: false },
    ];
    this.phase          = 'pre_start';
    this.wp             = 0;
    this.raceTime       = 0;
    this.distance       = 0;
    this._lastGateSide  = null;
    this._lastBX        = Boat.x;
    this._lastBY        = Boat.y;
  },

  reset() {
    Boat.x       = 2500;
    Boat.y       = 2800;
    Boat.heading = 0;
    Boat.speed   = 0;
    Boat.vx      = 0;
    Boat.vy      = 0;
    Camera.x     = Boat.x;
    Camera.y     = Boat.y;
    this.init();
  },

  // ── Update ─────────────────────────────────────────────────────────────────
  update(dt, boat) {
    // Gesamtstrecke
    const dx = boat.x - this._lastBX;
    const dy = boat.y - this._lastBY;
    this.distance += Math.hypot(dx, dy);
    this._lastBX = boat.x;
    this._lastBY = boat.y;

    if (this.phase === 'racing') this.raceTime += dt;

    const side   = this._gateSide(boat.x, boat.y);
    const inGate = boat.x > this.gate.port.x && boat.x < this.gate.stbd.x;
    const crossed = inGate && this._lastGateSide !== null
                    && this._lastGateSide > 0 && side <= 0;  // süd→nord

    if (this.wp === 0) {
      // Warten auf Start-Gate-Kreuzung
      if (crossed) {
        this.phase = 'racing';
        this.wp    = 1;
      }
    } else if (this.wp >= 1 && this.wp <= this.marks.length) {
      // Tonnen-Rundung per Proximity
      const mark = this.marks[this.wp - 1];
      const d = Math.hypot(boat.x - mark.x, boat.y - mark.y);
      // Approach erst bestätigt wenn Boot vorher 2.5× Radius entfernt war
      if (!mark.approached && d > mark.radius * 2.5) mark.approached = true;
      if (mark.approached && d < mark.radius) {
        mark.approached = false;
        mark.rounded    = true;
        this.wp++;
      }
    } else if (this.wp === this.marks.length + 1 && this.phase === 'racing') {
      // Ziel-Gate-Kreuzung
      if (crossed) this.phase = 'finished';
    }

    this._lastGateSide = side;
  },

  // ── Draw ───────────────────────────────────────────────────────────────────
  draw(ctx, canvas) {
    this._drawCoursePath(ctx, canvas);
    this._drawGate(ctx, canvas);
    this.marks.forEach((m, i) => this._drawMark(ctx, canvas, m, this.wp === i + 1 && this.phase === 'racing'));
    this._drawNextLine(ctx, canvas);
    this._drawHUD(ctx, canvas);
  },

  _drawCoursePath(ctx, canvas) {
    const pts = [
      { x: (this.gate.port.x + this.gate.stbd.x) / 2, y: this.gate.port.y },
      ...this.marks.map(m => ({ x: m.x, y: m.y })),
      { x: (this.gate.port.x + this.gate.stbd.x) / 2, y: this.gate.port.y },
    ];
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    pts.forEach((p, i) => {
      const s = Camera.toScreen(p.x, p.y, canvas);
      i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  },

  _drawGate(ctx, canvas) {
    const p = Camera.toScreen(this.gate.port.x, this.gate.port.y, canvas);
    const s = Camera.toScreen(this.gate.stbd.x, this.gate.stbd.y, canvas);

    // Linie zwischen den Gate-Bojen
    ctx.save();
    ctx.strokeStyle = this.phase === 'finished' ? 'rgba(68,238,136,0.6)' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Bojen
    this._buoy(ctx, p, Math.max(7, 12 * Camera.zoom), this.gate.port.color);
    this._buoy(ctx, s, Math.max(7, 12 * Camera.zoom), this.gate.stbd.color);

    // Label
    const mid = Camera.toScreen(
      (this.gate.port.x + this.gate.stbd.x) / 2,
      this.gate.port.y - 70,
      canvas
    );
    ctx.save();
    ctx.font      = `bold ${Math.max(11, 13 * Camera.zoom)}px sans-serif`;
    ctx.textAlign = 'center';
    if (this.phase === 'finished') {
      ctx.fillStyle = '#44ee88';
      ctx.fillText('ZIEL ✓', mid.x, mid.y);
    } else if (this.wp === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText('START', mid.x, mid.y);
    } else if (this.wp === this.marks.length + 1) {
      ctx.fillStyle = '#ffcc00';
      ctx.fillText('ZIEL →', mid.x, mid.y);
    }
    ctx.restore();
  },

  _drawMark(ctx, canvas, mark, isNext) {
    const s  = Camera.toScreen(mark.x, mark.y, canvas);
    const pr = Math.max(7, 12 * Camera.zoom);
    const rr = Math.max(12, mark.radius * Camera.zoom);

    ctx.save();

    // Annäherungs-Radius (gestrichelter Kreis, nur für nächste Tonne)
    if (isNext) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, rr, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,200,80,0.30)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pulsring
      const pulse = 0.5 + 0.5 * Math.abs(Math.sin(performance.now() * 0.003));
      ctx.beginPath();
      ctx.arc(s.x, s.y, pr * (1.6 + pulse * 0.6), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,220,80,${0.45 * pulse})`;
      ctx.lineWidth   = 2;
      ctx.stroke();
    }

    // Boje
    this._buoy(ctx, s, pr, mark.rounded ? '#445566' : (isNext ? '#ffffff' : mark.color));

    // Nummer
    ctx.font         = `bold ${Math.max(9, 11 * Camera.zoom)}px sans-serif`;
    ctx.fillStyle    = mark.rounded ? '#aaaaaa' : '#000000';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mark.label, s.x, s.y);

    // Haken wenn gerundet
    if (mark.rounded) {
      ctx.font      = `${Math.max(8, 10 * Camera.zoom)}px sans-serif`;
      ctx.fillStyle = '#44ee88';
      ctx.fillText('✓', s.x + pr * 1.4, s.y - pr * 1.0);
    }

    ctx.restore();
  },

  _buoy(ctx, screenPos, r, color) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, r, 0, Math.PI * 2);
    ctx.fillStyle   = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.restore();
  },

  _drawNextLine(ctx, canvas) {
    if (this.phase !== 'racing') return;
    let tx, ty;
    if (this.wp >= 1 && this.wp <= this.marks.length) {
      const m = this.marks[this.wp - 1];
      tx = m.x; ty = m.y;
    } else if (this.wp === this.marks.length + 1) {
      tx = (this.gate.port.x + this.gate.stbd.x) / 2;
      ty = this.gate.port.y;
    } else return;

    const from = Camera.toScreen(Boat.x, Boat.y, canvas);
    const to   = Camera.toScreen(tx, ty, canvas);

    ctx.save();
    ctx.strokeStyle = 'rgba(255,200,80,0.30)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x,   to.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  },

  _drawHUD(ctx, canvas) {
    const PAD  = 10;
    const W    = 200;
    const LINE = 18;
    const lines = this._hudLines();
    const H    = PAD * 2 + lines.length * LINE;
    const X    = canvas.width - W - PAD;
    const Y    = PAD;

    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(X, Y, W, H);

    ctx.font = '12px monospace';
    lines.forEach((l, i) => {
      ctx.fillStyle = l.color || '#00ff88';
      ctx.fillText(l.text, X + 8, Y + 14 + i * LINE);
    });
  },

  _hudLines() {
    const G  = '#334455';
    const lines = [];

    const phaseLabel = { pre_start: 'PRE-START', racing: '● RENNEN', finished: '✓ ZIEL!' }[this.phase];
    const phaseColor = { pre_start: '#888888',   racing: '#ffcc00',  finished: '#44ee88' }[this.phase];
    lines.push({ text: phaseLabel, color: phaseColor });
    lines.push({ text: '──────────────────', color: G });

    if (this.phase !== 'pre_start') {
      lines.push({ text: `Zeit:   ${this._fmtTime(this.raceTime)}` });
    }

    lines.push({ text: `Speed:  ${Boat.speed.toFixed(1)} kn` });
    lines.push({ text: `Gesamt: ${(this.distance / 1852).toFixed(2)} nM` });

    if (this.phase === 'racing') {
      lines.push({ text: '──────────────────', color: G });
      lines.push({ text: `Nächste: ${this._nextLabel()}`, color: '#ffcc00' });
      lines.push({ text: `Dist:    ${this._nextDist().toFixed(0)} m` });
    }

    if (this.phase === 'pre_start') {
      lines.push({ text: '──────────────────', color: G });
      lines.push({ text: 'Startlinie kreuzen', color: '#666677' });
    }

    return lines;
  },

  _fmtTime(s) {
    const m   = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    const ms  = Math.floor((s % 1) * 10);
    return `${m}:${sec}.${ms}`;
  },

  _nextLabel() {
    if (this.wp >= 1 && this.wp <= this.marks.length) return `Tonne ${this.marks[this.wp - 1].label}`;
    if (this.wp === this.marks.length + 1)            return 'ZIEL-Gate';
    return '—';
  },

  _nextDist() {
    if (this.wp >= 1 && this.wp <= this.marks.length) {
      const m = this.marks[this.wp - 1];
      return Math.hypot(Boat.x - m.x, Boat.y - m.y);
    }
    if (this.wp === this.marks.length + 1) {
      const mx = (this.gate.port.x + this.gate.stbd.x) / 2;
      return Math.hypot(Boat.x - mx, Boat.y - this.gate.port.y);
    }
    return 0;
  },

  // Positive = südlich der Gate-Linie, negativ = nördlich
  _gateSide(bx, by) {
    const p = this.gate.port, s = this.gate.stbd;
    return (s.x - p.x) * (by - p.y) - (s.y - p.y) * (bx - p.x);
  },
};
