// Wasser - einfache Flaeche plus animierte Dreiecks-Wellen
const WaterMesh = {
  _elapsed: 0,
  _triangles: [],

  init() {
    this._triangles = [];

    const cellLen = 240;
    const cellWid = 220;
    for (let ax = Math.floor(-2500 / cellLen); ax <= Math.ceil(8000 / cellLen); ax++) {
      for (let cy = Math.floor(-2500 / cellWid); cy <= Math.ceil(8000 / cellWid); cy++) {
        const count = Math.floor(this._hash(ax, cy, 91.7) * 4) + 1;
        const maxSize = 7 + this._hash(ax, cy, 5.1) * 3.5;
        const rowSpacing = maxSize * 1.15;

        for (let i = 0; i < count; i++) {
          this._triangles.push({
            along: (ax + 0.5) * cellLen,
            cross: (cy + 0.5) * cellWid + (i - (count - 1) * 0.5) * rowSpacing,
            delay: this._hash(ax, cy, 43.1) * 5,
            maxSize,
            speed: 28 + (this._hash(ax, cy, 12.9) - 0.5) * 4,
          });
        }
      }
    }
  },

  update(dt) {
    this._elapsed += dt;
  },

  draw(ctx) {
    ctx.fillStyle = '#487cae';
    ctx.fillRect(-3500, -3500, 12000, 12000);

    const wtoX = Math.sin(Wind.dir);
    const wtoY = -Math.cos(Wind.dir);
    const wpX = -wtoY;
    const wpY = wtoX;

    ctx.save();
    ctx.fillStyle = '#e6f7ff';
    this._triangles.forEach(t => {
      const buildTime = 2.0;
      const breakTime = 3.0;
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
      const alpha = life < buildTime ? 0.5 * build : 0.5;

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      this._wavePoint(ctx, wtoX, wtoY, wpX, wpY, baseAlong + tipX, t.cross, true);
      this._wavePoint(ctx, wtoX, wtoY, wpX, wpY, baseAlong + baseX, t.cross + size * 0.5);
      this._wavePoint(ctx, wtoX, wtoY, wpX, wpY, baseAlong + baseX, t.cross - size * 0.5);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
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
