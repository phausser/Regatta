// Wind system – true wind direction/speed with slow random drift
const Wind = {
  dir:   Math.PI / 2,   // direction wind blows TO (0=north CW+); start: blowing east
  speed: 8,             // world-units / second

  vx: 0, vy: 0,         // velocity vector (+x east, +y south / canvas)

  _driftTimer:  0,
  _targetDir:   Math.PI / 2,

  update(dt) {
    this._driftTimer -= dt;
    if (this._driftTimer <= 0) {
      this._driftTimer     = 15 + Math.random() * 25;      // shift every 15–40 s
      this._targetDir     += (Math.random() - 0.5) * 0.26; // ±~15°
    }
    this.dir += (this._targetDir - this.dir) * dt * 0.05;  // smooth drift

    this.vx =  Math.sin(this.dir) * this.speed;
    this.vy = -Math.cos(this.dir) * this.speed;             // north = -y in canvas
  },

  // Compass bearing wind blows FROM (degrees, 0=N CW+)
  fromDeg() {
    let deg = ((this.dir + Math.PI) % (Math.PI * 2)) * 180 / Math.PI;
    if (deg < 0) deg += 360;
    return deg;
  },

  // Compass bearing wind blows TO (degrees)
  toDeg() {
    let deg = this.dir * 180 / Math.PI;
    if (deg < 0) deg += 360;
    return deg % 360;
  }
};
