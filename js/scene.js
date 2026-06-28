// Three.js scene, camera, renderer – replaces camera.js + renderer.js
const WORLD_SIZE = 5000;
const MAX_ZOOM   = 5;

const Scene = {
  x:    2500,
  y:    2500,
  zoom: 1,

  _scene:      null,
  _camera:     null,
  _renderer:   null,
  _sun:        null,

  init() {
    this.x = Boat.x;
    this.y = Boat.y;

    this._scene = new THREE.Scene();

    this._renderer = new THREE.WebGLRenderer({ antialias: true });
    this._renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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
      this.zoom = this.clampZoom(this.zoom * f);
      this._applyFrustum();
    }, { passive: false });

    window.addEventListener('resize', () => {
      this._renderer.setSize(window.innerWidth, window.innerHeight);
      this.zoom = this.clampZoom(this.zoom);
      this._applyFrustum();
    });

    this._buildScene();
  },

  applyFrustum() { this._applyFrustum(); },

  // Rauszoomen begrenzt: sichtbare Welt ≤ WORLD_SIZE in beiden Achsen
  minZoom() {
    return Math.max(window.innerWidth / WORLD_SIZE, window.innerHeight / WORLD_SIZE);
  },

  clampZoom(z) {
    return Math.max(this.minZoom(), Math.min(MAX_ZOOM, z));
  },

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
    this._buildLights();
    this._buildShadowReceiver();

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

  _buildLights() {
    this._scene.add(new THREE.AmbientLight(0xb8d8f0, 0.78));

    this._sun = new THREE.DirectionalLight(0xfffaf2, 1.05);
    this._sun.position.set(1400, 1800, 800);
    this._sun.target.position.set(2500, 0, 2500);
    this._sun.castShadow = true;
    this._sun.shadow.mapSize.set(2048, 2048);
    this._sun.shadow.camera.left = -2200;
    this._sun.shadow.camera.right = 2200;
    this._sun.shadow.camera.top = 2200;
    this._sun.shadow.camera.bottom = -2200;
    this._sun.shadow.camera.near = 100;
    this._sun.shadow.camera.far = 4000;
    this._sun.shadow.bias = -0.0004;
    this._scene.add(this._sun);
    this._scene.add(this._sun.target);
  },

  _buildShadowReceiver() {
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(12000, 12000),
      new THREE.ShadowMaterial({ color: 0x3a6888, opacity: 0.07, transparent: true }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(2500, 0.08, 2500);
    shadowPlane.receiveShadow = true;
    this._scene.add(shadowPlane);
  },

  updateMeshes() {
    BoatMesh.update();
    MarksMesh.update();
  },

  render() {
    this._renderer.render(this._scene, this._camera);
  },
};
