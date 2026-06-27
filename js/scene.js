// Three.js scene, camera, renderer – replaces camera.js + renderer.js
const Scene = {
  x:    2500,
  y:    2500,
  zoom: 1,

  _scene:      null,
  _camera:     null,
  _renderer:   null,

  init() {
    this.x = Boat.x;
    this.y = Boat.y;

    this._scene = new THREE.Scene();

    this._renderer = new THREE.WebGLRenderer({ antialias: true });
    this._renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this._renderer.setSize(window.innerWidth, window.innerHeight);

    const el = this._renderer.domElement;
    el.style.position = 'fixed';
    el.style.top      = '0';
    el.style.left     = '0';
    el.style.zIndex   = '0';
    document.body.appendChild(el);

    this._camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2000);
    this._camera.up.set(0, 0, -1);
    this._syncCamera();

    el.addEventListener('wheel', e => {
      e.preventDefault();
      const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      this.zoom = Math.max(0.1, Math.min(5, this.zoom * f));
      this._applyFrustum();
    }, { passive: false });

    window.addEventListener('resize', () => {
      this._renderer.setSize(window.innerWidth, window.innerHeight);
      this._applyFrustum();
    });

    this._buildScene();
  },

  applyFrustum() { this._applyFrustum(); },

  _applyFrustum() {
    const hw = window.innerWidth  / 2 / this.zoom;
    const hh = window.innerHeight / 2 / this.zoom;
    this._camera.left   = -hw;
    this._camera.right  =  hw;
    this._camera.top    =  hh;
    this._camera.bottom = -hh;
    this._camera.updateProjectionMatrix();
  },

  _syncCamera() {
    this._camera.position.set(this.x, 1000, this.y);
    this._camera.lookAt(new THREE.Vector3(this.x, 0, this.y));
    this._applyFrustum();
  },

  follow(target) {
    this.x = target.x;
    this.y = target.y;
    this._syncCamera();
  },

  _buildScene() {
    // Animated water (shader)
    WaterMesh.init(this._scene);

    // Grid 500 WU
    const gPts = [];
    for (let i = 0; i <= 10; i++) {
      const v = i * 500;
      gPts.push(v, 0, 0, v, 0, 5000, 0, 0, v, 5000, 0, v);
    }
    const gGeo = new THREE.BufferGeometry();
    gGeo.setAttribute('position', new THREE.Float32BufferAttribute(gPts, 3));
    this._scene.add(new THREE.LineSegments(gGeo,
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.04 })));

    // World border (5000 × 5000)
    this._scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(   0, 0.2,    0),
        new THREE.Vector3(5000, 0.2,    0),
        new THREE.Vector3(5000, 0.2, 5000),
        new THREE.Vector3(   0, 0.2, 5000),
        new THREE.Vector3(   0, 0.2,    0),
      ]),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 })));

    // Course marks, gate and path
    MarksMesh.init(this._scene);

    // Boat (hull + mast + sail + bow wave)
    BoatMesh.init(this._scene);
  },

  updateMeshes() {
    BoatMesh.update();
    MarksMesh.update();
  },

  render() {
    this._renderer.render(this._scene, this._camera);
  },
};
