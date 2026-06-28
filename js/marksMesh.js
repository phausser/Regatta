const MarksMesh = {
  _bob: [],

  init() {
    this._bob = Race.marks.map(() => 0);
  },

  update() {
    const t = performance.now() * 0.001;
    this._bob = Race.marks.map((_, i) => Math.sin(t * 2.2 + i * 1.7) * 2.0);
  },

  draw(ctx) {
    this._drawCoursePath(ctx);
    this._drawGate(ctx);
    this._drawMarks(ctx);
  },

  _drawGate(ctx) {
    const p = Race.gate.port;
    const s = Race.gate.stbd;

    ctx.save();
    ctx.lineWidth = 2 / Scene.zoom;
    ctx.strokeStyle = Race.phase === 'finished'
      ? 'rgba(51,238,102,0.45)'
      : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();

    this._drawPost(ctx, p.x, p.y, p.color);
    this._drawPost(ctx, s.x, s.y, s.color);
    ctx.restore();
  },

  _drawPost(ctx, x, y, color) {
    this._shadow(ctx, x + 5, y + 7, 34, 18, 0.22);

    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(255,255,255,0.32)';
    ctx.lineWidth = 1 / Scene.zoom;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  },

  _drawMarks(ctx) {
    Race.marks.forEach((mark, i) => {
      const isNext = Race.wp === i + 1 && Race.phase === 'racing';
      const color = mark.rounded ? '#445566' : (isNext ? '#ffffff' : mark.color);
      const capColor = mark.rounded ? '#667788' : (isNext ? '#fff5c0' : '#ffe080');
      const bob = this._bob[i] || 0;

      if (isNext) {
        ctx.save();
        ctx.strokeStyle = `rgba(255,220,80,${0.30 + Math.sin(performance.now() * 0.004) * 0.12})`;
        ctx.lineWidth = 2 / Scene.zoom;
        ctx.beginPath();
        ctx.arc(mark.x, mark.y, mark.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      this._shadow(ctx, mark.x + 7, mark.y + 10, 48, 26, 0.26);

      ctx.save();
      ctx.translate(mark.x, mark.y + bob);
      ctx.fillStyle = color;
      ctx.strokeStyle = 'rgba(255,255,255,0.26)';
      ctx.lineWidth = 1 / Scene.zoom;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = capColor;
      ctx.beginPath();
      ctx.arc(0, -3, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  },

  _drawCoursePath(ctx) {
    const midX = (Race.gate.port.x + Race.gate.stbd.x) / 2;
    const midY = Race.gate.port.y;

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 2 / Scene.zoom;
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    Race.marks.forEach(m => ctx.lineTo(m.x, m.y));
    ctx.lineTo(midX, midY);
    ctx.stroke();
    ctx.restore();
  },

  _shadow(ctx, x, y, rx, ry, alpha) {
    ctx.save();
    ctx.fillStyle = `rgba(10,31,50,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
};
