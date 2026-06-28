const _B = {
  HL: WORLD_SCALE * 0.58,
  HS: WORLD_SCALE * 0.46,
  HW: WORLD_SCALE * 0.18,
  SW: WORLD_SCALE * 0.16,
  MZ: -WORLD_SCALE * 0.12,
};

const BoatMesh = {
  _particles: [],

  init() {
    this._particles = Array.from({ length: 40 }, () => ({
      x: 0,
      y: 0,
      a: 0,
      r: 1 + Math.random() * 1.6,
    }));
  },

  update() {
    const speedNorm = Math.min(1, Boat.speed / 12);
    const bowX = Math.sin(Boat.heading);
    const bowY = -Math.cos(Boat.heading);
    const stbdX = -bowY;
    const stbdY = bowX;

    this._particles.forEach((p, i) => {
      if (Math.random() < speedNorm * 0.18 || p.a <= 0) {
        const side = i % 2 === 0 ? 1 : -1;
        const spread = (Math.random() * 0.7 + 0.35) * _B.HW;
        p.x = Boat.x + bowX * _B.HL + stbdX * side * spread;
        p.y = Boat.y + bowY * _B.HL + stbdY * side * spread;
        p.a = speedNorm * (0.20 + Math.random() * 0.22);
      } else {
        p.x -= bowX * (1.2 + speedNorm * 2.8);
        p.y -= bowY * (1.2 + speedNorm * 2.8);
        p.a *= 0.92;
      }
    });
  },

  draw(ctx) {
    this._drawShadow(ctx);
    this._drawParticles(ctx);

    ctx.save();
    ctx.translate(Boat.x, Boat.y);
    ctx.rotate(Boat.heading);

    this._drawHull(ctx);
    this._drawMast(ctx);
    this._drawSail(ctx);

    ctx.restore();
  },

  _drawShadow(ctx) {
    ctx.save();
    ctx.translate(Boat.x + 10, Boat.y + 13);
    ctx.rotate(Boat.heading + 0.18);
    ctx.fillStyle = 'rgba(10,31,50,0.34)';
    ctx.beginPath();
    ctx.ellipse(0, 1, _B.HW * 1.22, (_B.HL + _B.HS) * 0.50, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  _drawHull(ctx) {
    const { HL, HS, HW, SW } = _B;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -HL);
    ctx.bezierCurveTo(-HW * 0.20, -HL * 0.88, -HW * 0.88, -HL * 0.38, -HW, 0);
    ctx.bezierCurveTo(-HW * 0.98, HS * 0.44, -SW * 1.08, HS * 0.90, -SW, HS);
    ctx.lineTo(SW, HS);
    ctx.bezierCurveTo(SW * 1.08, HS * 0.90, HW * 0.98, HS * 0.44, HW, 0);
    ctx.bezierCurveTo(HW * 0.88, -HL * 0.38, HW * 0.20, -HL * 0.88, 0, -HL);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  _drawMast(ctx) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(6,23,45,0.28)';
    ctx.lineWidth = 1.5 / Scene.zoom;
    ctx.beginPath();
    ctx.arc(0, _B.MZ, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  },

  _drawSail(ctx) {
    const sailLen = _B.HS * 1.10 * (Boat.reefed ? 0.62 : 1.0);
    const side = Boat.awa >= 0 ? -1 : 1;
    const angle = side * Boat.trimAngle;
    const boomX = Math.sin(angle) * sailLen;
    const boomY = Math.cos(angle) * sailLen;
    const bMag = Math.hypot(boomX, boomY) || 1e-6;
    const nX = boomX / bMag;
    const nY = boomY / bMag;
    const pX = -nY;
    const pY = nX;
    const halfW = Math.max(3.4, sailLen * 0.30);
    const belly = sailLen * 0.32 * Math.max(0.12, Boat.trimEff);
    const luff = Boat.sailState === 'luffing'
      ? 0.35 + Math.max(0, Math.sin(performance.now() * 0.0065)) * 0.65
      : 1.0;

    const luffX = -side * pX * halfW * 0.35;
    const luffY = _B.MZ - side * pY * halfW * 0.35;
    const leeX = boomX + side * pX * halfW + side * belly * luff * 0.5;
    const leeY = _B.MZ + boomY + side * pY * halfW + side * belly * luff * 0.15;
    const midX = boomX * 0.52 + side * pX * halfW * 0.65 + side * belly * luff;
    const midY = _B.MZ + boomY * 0.52 + side * pY * halfW * 0.65;

    ctx.save();
    ctx.fillStyle = '#44ff88';
    ctx.strokeStyle = 'rgba(26,136,68,0.95)';
    ctx.lineWidth = 1.5 / Scene.zoom;
    ctx.beginPath();
    ctx.moveTo(luffX, luffY);
    ctx.lineTo(0, _B.MZ);
    ctx.lineTo(midX, midY);
    ctx.lineTo(leeX, leeY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  },

  _drawParticles(ctx) {
    ctx.save();
    this._particles.forEach(p => {
      if (p.a <= 0.01) return;
      ctx.globalAlpha = p.a;
      ctx.fillStyle = '#c0d8ff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  },
};
