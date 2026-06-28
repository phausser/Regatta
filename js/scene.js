// Canvas scene, camera and render orchestration
const WORLD_SIZE = 5000;
const MAX_ZOOM   = 5;

const Scene = {
  x:    2500,
  y:    2500,
  zoom: 1,

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
