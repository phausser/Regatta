// Wasser - einfache Flaeche plus animierte Dreiecks-Wellen
const WaterMesh = {
  _elapsed: 0,
  _cellLen: 240,
  _cellWid: 220,

  init() {
    this._elapsed = 0;
  },

  update(dt) {
    this._elapsed += dt;
  },

  draw(ctx) {
    const sv = Scene.shadowVector(1000);
    const grad = ctx.createLinearGradient(2500 - sv.x, 2500 - sv.y, 2500 + sv.x, 2500 + sv.y);
    grad.addColorStop(0, '#7799ff');
    grad.addColorStop(1, '#113388');
    ctx.fillStyle = grad;
    ctx.fillRect(-3500, -3500, 12000, 12000);

    const wtoX = Math.sin(Wind.dir);
    const wtoY = -Math.cos(Wind.dir);
    const wpX = -wtoY;
    const wpY = wtoX;
    const bounds = this._visibleWindBounds(wtoX, wtoY, wpX, wpY);

    ctx.save();
    ctx.fillStyle = '#e6f7ff';
    for (let ax = bounds.minAx; ax <= bounds.maxAx; ax++) {
      for (let cy = bounds.minCy; cy <= bounds.maxCy; cy++) {
        this._drawCell(ctx, ax, cy, wtoX, wtoY, wpX, wpY);
      }
    }
    ctx.restore();
  },

  _visibleWindBounds(wtoX, wtoY, wpX, wpY) {
    const halfW = window.innerWidth / (2 * Scene.zoom);
    const halfH = window.innerHeight / (2 * Scene.zoom);
    const corners = [
      { x: Scene.x - halfW, y: Scene.y - halfH },
      { x: Scene.x + halfW, y: Scene.y - halfH },
      { x: Scene.x + halfW, y: Scene.y + halfH },
      { x: Scene.x - halfW, y: Scene.y + halfH },
    ];

    let minAlong = Infinity;
    let maxAlong = -Infinity;
    let minCross = Infinity;
    let maxCross = -Infinity;
    corners.forEach(p => {
      const along = wtoX * p.x + wtoY * p.y;
      const cross = wpX * p.x + wpY * p.y;
      minAlong = Math.min(minAlong, along);
      maxAlong = Math.max(maxAlong, along);
      minCross = Math.min(minCross, cross);
      maxCross = Math.max(maxCross, cross);
    });

    const pad = 360;
    return {
      minAx: Math.floor((minAlong - pad) / this._cellLen),
      maxAx: Math.ceil((maxAlong + pad) / this._cellLen),
      minCy: Math.floor((minCross - pad) / this._cellWid),
      maxCy: Math.ceil((maxCross + pad) / this._cellWid),
    };
  },

  _drawCell(ctx, ax, cy, wtoX, wtoY, wpX, wpY) {
    const count = Math.floor(this._hash(ax, cy, 91.7) * 4) + 1;
    const maxSize = 7 + this._hash(ax, cy, 5.1) * 3.5;
    const rowSpacing = maxSize * 1.15;

    for (let i = 0; i < count; i++) {
      this._drawTriangle(ctx, {
        along: (ax + 0.5) * this._cellLen,
        cross: (cy + 0.5) * this._cellWid + (i - (count - 1) * 0.5) * rowSpacing,
        delay: this._hash(ax, cy, 43.1) * 5,
        maxSize,
        speed: 28 + (this._hash(ax, cy, 12.9) - 0.5) * 4,
      }, wtoX, wtoY, wpX, wpY);
    }
  },

  _drawTriangle(ctx, t, wtoX, wtoY, wpX, wpY) {
    const buildTime = 2;
    const breakTime = 3;
    const cycle = buildTime + breakTime;
    const life = (this._elapsed + t.delay) % cycle;

    const build = Math.max(0, Math.min(1, life / buildTime));
    const brk = Math.max(0, Math.min(1, (life - buildTime) / breakTime));
    const breakElapsed = Math.max(life - buildTime, 0);
    const grow = this._smooth(build);
    const slide = this._smooth(Math.max(0, Math.min(1, breakElapsed)));
    const shrink = this._smooth(Math.max(0, Math.min(1, brk * 2 - 1)));
    const size = life < buildTime ? this._mix(1.2, t.maxSize, grow) : this._mix(t.maxSize, 0.6, shrink);

    const h = size * 0.866025404;
    const firstHalf = Math.max(0, Math.min(1, slide * 2));
    const secondHalf = Math.max(0, Math.min(1, slide * 2 - 1));
    let tipX = this._mix(-h * 0.666666667, 0, firstHalf);
    tipX = this._mix(tipX, h * 0.666666667, secondHalf);
    const baseX = this._mix(h * 0.333333333, -h * 0.333333333, secondHalf);

    const driftAlong = t.speed * life;
    const baseAlong = t.along + driftAlong;
    const alpha = life < buildTime ? 0.4 * build : 0.4;

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    this._wavePoint(ctx, wtoX, wtoY, wpX, wpY, baseAlong + tipX, t.cross, true);
    this._wavePoint(ctx, wtoX, wtoY, wpX, wpY, baseAlong + baseX, t.cross + size * 0.5);
    this._wavePoint(ctx, wtoX, wtoY, wpX, wpY, baseAlong + baseX, t.cross - size * 0.5);
    ctx.closePath();
    ctx.fill();
  },

  _wavePoint(ctx, wtoX, wtoY, wpX, wpY, along, cross, move) {
    const x = wtoX * along + wpX * cross;
    const y = wtoY * along + wpY * cross;
    if (move) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  },

  _hash(x, y, salt) {
    const v = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
    return v - Math.floor(v);
  },

  _mix(a, b, t) { return a + (b - a) * t; },
  _smooth(t) { return t * t * (3 - 2 * t); },
};
