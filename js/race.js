// Race – course definition, waypoint logic, timing, HUD
const Race = {

  // ── Kursdefinition ─────────────────────────────────────────────────────────
  gate: {
    port: { x: 2100, y: 2600, color: '#ff4455' },   // Backbord: rot
    stbd: { x: 2900, y: 2600, color: '#44ee88' },   // Steuerbord: grün
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
      { x: 1600, y: 1100, radius: 90, color: '#ffcc00', label: '1', approached: false, rounded: false },
      { x: 3800, y: 1300, radius: 90, color: '#ffcc00', label: '2', approached: false, rounded: false },
      { x: 2500, y: 3200, radius: 90, color: '#ffcc00', label: '3', approached: false, rounded: false },
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
    Scene.x      = Boat.x;
    Scene.y      = Boat.y;
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

  _hudLines() {
    const G  = 'rgba(8,52,120,0.20)';
    const SEA = '#083478';
    const lines = [];

    const phaseLabel = { pre_start: 'PRE-START', racing: '● RENNEN', finished: '✓ ZIEL!' }[this.phase];
    const phaseColor = { pre_start: 'rgba(8,52,120,0.45)', racing: SEA, finished: SEA }[this.phase];
    lines.push({ text: phaseLabel, color: phaseColor });
    lines.push({ text: '──────────────────', color: G });

    if (this.phase !== 'pre_start') {
      lines.push({ text: `Zeit:   ${this._fmtTime(this.raceTime)}` });
    }

    lines.push({ text: `Speed:  ${Boat.speed.toFixed(1)} kn` });
    lines.push({ text: `Gesamt: ${(this.distance / 1852).toFixed(2)} nM` });

    if (this.phase === 'racing') {
      lines.push({ text: '──────────────────', color: G });
      lines.push({ text: `Nächste: ${this._nextLabel()}` });
      lines.push({ text: `Dist:    ${this._nextDist().toFixed(0)} m` });
    }

    if (this.phase === 'pre_start') {
      lines.push({ text: '──────────────────', color: G });
      lines.push({ text: 'Startlinie kreuzen', color: 'rgba(8,52,120,0.50)' });
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
