// Canvas scene, camera and render orchestration
const WORLD_SIZE = 5000;
const MAX_ZOOM   = 5;

const Scene = {
  x:    2500,
  y:    2500,
  zoom: 1,
  sun: {
    x: 1400,
    y: 700,
    z: 800,
    targetX: 2500,
    targetZ: 2500,
  },

  _canvas:   null,
  _ctx:      null,
  _renderer: null,
  _dpr:      1,

  init() {
    this.x = Boat.x;
    this.y = Boat.y;

    this._canvas = document.createElement('canvas');
    this._ctx = this._canvas.getContext('2d');
    this._renderer = { domElement: this._canvas };

    const el = this._canvas;
    el.style.position = 'fixed';
    el.style.top      = '0';
    el.style.left     = '0';
    el.style.zIndex   = '0';
    document.body.appendChild(el);

    this._resize();
    window.addEventListener('resize', () => {
      this._resize();
      this.zoom = this.clampZoom(this.zoom);
    });

    el.addEventListener('wheel', e => {
      e.preventDefault();
      const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      this.zoom = this.clampZoom(this.zoom * f);
    }, { passive: false });

    WaterMesh.init();
    MarksMesh.init();
    BoatMesh.init();
  },

  applyFrustum() {},

  minZoom() {
    return Math.max(window.innerWidth / WORLD_SIZE, window.innerHeight / WORLD_SIZE);
  },

  clampZoom(z) {
    return Math.max(this.minZoom(), Math.min(MAX_ZOOM, z));
  },

  follow(target) {
    this.x = target.x;
    this.y = target.y;
  },

  worldToScreen(x, y) {
    return {
      x: (x - this.x) * this.zoom + window.innerWidth / 2,
      y: (y - this.y) * this.zoom + window.innerHeight / 2,
    };
  },

  _resize() {
    this._dpr = Math.min(window.devicePixelRatio || 1, 2);
    this._canvas.width  = Math.floor(window.innerWidth * this._dpr);
    this._canvas.height = Math.floor(window.innerHeight * this._dpr);
    this._canvas.style.width  = `${window.innerWidth}px`;
    this._canvas.style.height = `${window.innerHeight}px`;
  },

  _beginWorld() {
    const ctx = this._ctx;
    ctx.save();
    ctx.scale(this._dpr, this._dpr);
    ctx.translate(window.innerWidth / 2, window.innerHeight / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  },

  _drawGrid() {
    const ctx = this._ctx;

    ctx.save();
    ctx.lineWidth = 1 / this.zoom;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    for (let v = 0; v <= WORLD_SIZE; v += 500) {
      ctx.moveTo(v, 0);
      ctx.lineTo(v, WORLD_SIZE);
      ctx.moveTo(0, v);
      ctx.lineTo(WORLD_SIZE, v);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);
    ctx.restore();
  },

  shadowVector(height) {
    const sx = this.sun.targetX - this.sun.x;
    const sy = this.sun.targetZ - this.sun.z;
    const ground = Math.hypot(sx, sy) || 1;
    const len = height * ground / Math.max(1, this.sun.y);

    return {
      x: sx / ground * len,
      y: sy / ground * len,
      len,
    };
  },

  drawProjectedShadow(ctx, points, height, alpha) {
    if (points.length < 3) return;

    const sv = this.shadowVector(height);
    const projected = points.map(p => ({ x: p.x + sv.x, y: p.y + sv.y }));
    const hull = this._convexHull([...points, ...projected]);
    if (hull.length < 3) return;

    const center = points.reduce((acc, p) => {
      acc.x += p.x;
      acc.y += p.y;
      return acc;
    }, { x: 0, y: 0 });
    center.x /= points.length;
    center.y /= points.length;

    const grad = ctx.createLinearGradient(center.x, center.y, center.x + sv.x, center.y + sv.y);
    grad.addColorStop(0, `rgba(5,18,36,${alpha})`);
    grad.addColorStop(0.35, `rgba(5,18,36,${alpha * 0.62})`);
    grad.addColorStop(0.72, `rgba(5,18,36,${alpha * 0.24})`);
    grad.addColorStop(1, 'rgba(5,18,36,0)');

    ctx.save();
    ctx.filter = 'blur(0.7px)';
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(hull[0].x, hull[0].y);
    for (let i = 1; i < hull.length; i++) ctx.lineTo(hull[i].x, hull[i].y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = `rgba(5,18,36,${alpha * 0.50})`;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  _convexHull(points) {
    const sorted = points
      .slice()
      .sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower = [];
    sorted.forEach(p => {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        lower.pop();
      }
      lower.push(p);
    });

    const upper = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }

    lower.pop();
    upper.pop();
    return lower.concat(upper);
  },

  updateMeshes() {
    BoatMesh.update();
    MarksMesh.update();
  },

  render() {
    const ctx = this._ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    this._beginWorld();
    WaterMesh.draw(ctx);
    this._drawGrid();
    MarksMesh.draw(ctx);
    BoatMesh.draw(ctx);
    ctx.restore();
  },
};
