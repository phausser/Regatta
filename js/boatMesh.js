const _B = {
  HL: WORLD_SCALE * 0.58,
  HS: WORLD_SCALE * 0.46,
  HW: WORLD_SCALE * 0.18,
  SW: WORLD_SCALE * 0.16,
  MZ: -WORLD_SCALE * 0.12,
};

const BoatMesh = {
  _particles: [],
  _hullPoints: [],

  init() {
    this._hullPoints = this._buildHullPoints();
    this._particles = Array.from({ length: 140 }, () => ({
      x: 0,
      y: 0,
      a: 0,
    }));
  },

  update() {
    const speedNorm = Math.min(1, Boat.speed / 12);
    const bowX = Math.sin(Boat.heading);
    const bowY = -Math.cos(Boat.heading);
    const stbdX = -bowY;
    const stbdY = bowX;

    this._particles.forEach((p, i) => {
      if (p.a <= 0 && Math.random() < speedNorm * 0.16) {
        const side = i % 2 === 0 ? 1 : -1;
        const spread = (Math.random() * 0.75 + 0.20) * _B.HW;
        const aft = Math.random() * 5.0;
        p.x = Boat.x + bowX * (_B.HL - aft) + stbdX * side * spread;
        p.y = Boat.y + bowY * (_B.HL - aft) + stbdY * side * spread;
        p.a = 0.42 + speedNorm * 0.42;
      } else {
        p.x -= bowX * (0.08 + speedNorm * 0.28);
        p.y -= bowY * (0.08 + speedNorm * 0.28);
        p.a *= 0.972;
        if (p.a < 0.01) p.a = 0;
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
    const c = Math.cos(Boat.heading);
    const s = Math.sin(Boat.heading);
    const points = this._hullPoints.map(p => ({
      x: Boat.x + p.x * c - p.y * s,
      y: Boat.y + p.x * s + p.y * c,
    }));
    Scene.drawProjectedShadow(ctx, points, 18, 0.44);
  },

  _drawHull(ctx) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    this._traceHull(ctx);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  _traceHull(ctx) {
    const { HL, HS, HW, SW } = _B;
    ctx.moveTo(0, -HL);
    ctx.bezierCurveTo(-HW * 0.20, -HL * 0.88, -HW * 0.88, -HL * 0.38, -HW, 0);
    ctx.bezierCurveTo(-HW * 0.98, HS * 0.44, -SW * 1.08, HS * 0.90, -SW, HS);
    ctx.lineTo(SW, HS);
    ctx.bezierCurveTo(SW * 1.08, HS * 0.90, HW * 0.98, HS * 0.44, HW, 0);
    ctx.bezierCurveTo(HW * 0.88, -HL * 0.38, HW * 0.20, -HL * 0.88, 0, -HL);
  },

  _buildHullPoints() {
    const { HL, HS, HW, SW } = _B;
    const pts = [];
    const cubic = (p0, p1, p2, p3, t) => {
      const u = 1 - t;
      return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
    };
    const addBezier = (p0, p1, p2, p3, steps) => {
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        pts.push({
          x: cubic(p0.x, p1.x, p2.x, p3.x, t),
          y: cubic(p0.y, p1.y, p2.y, p3.y, t),
        });
      }
    };

    pts.push({ x: 0, y: -HL });
    addBezier(
      { x: 0, y: -HL },
      { x: -HW * 0.20, y: -HL * 0.88 },
      { x: -HW * 0.88, y: -HL * 0.38 },
      { x: -HW, y: 0 },
      8,
    );
    addBezier(
      { x: -HW, y: 0 },
      { x: -HW * 0.98, y: HS * 0.44 },
      { x: -SW * 1.08, y: HS * 0.90 },
      { x: -SW, y: HS },
      8,
    );
    pts.push({ x: SW, y: HS });
    addBezier(
      { x: SW, y: HS },
      { x: SW * 1.08, y: HS * 0.90 },
      { x: HW * 0.98, y: HS * 0.44 },
      { x: HW, y: 0 },
      8,
    );
    addBezier(
      { x: HW, y: 0 },
      { x: HW * 0.88, y: -HL * 0.38 },
      { x: HW * 0.20, y: -HL * 0.88 },
      { x: 0, y: -HL },
      8,
    );
    return pts;
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
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x, p.y, 1.7 / Scene.zoom, 1.7 / Scene.zoom);
    });
    ctx.restore();
  },
};
