// Three.js scene, camera, renderer – replaces camera.js + renderer.js
const Scene = {
  x:    2500,
  y:    2500,
  zoom: 1,

  _scene:      null,
  _camera:     null,
  _renderer:   null,
  _boatGroup:  null,
  _markMeshes: [],

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
    // Water
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(12000, 12000),
      new THREE.MeshBasicMaterial({ color: 0x083478 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(2500, -0.5, 2500);
    this._scene.add(water);

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

    // Gate cylinders + line
    const cyl = (x, z, color) => {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 6, 16, 8),
        new THREE.MeshBasicMaterial({ color })
      );
      m.position.set(x, 8, z);
      this._scene.add(m);
      return m;
    };
    cyl(Race.gate.port.x, Race.gate.port.y, 0xff4455);
    cyl(Race.gate.stbd.x, Race.gate.stbd.y, 0x44ee88);
    this._scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Race.gate.port.x, 8, Race.gate.port.y),
        new THREE.Vector3(Race.gate.stbd.x, 8, Race.gate.stbd.y),
      ]),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })));

    // Mark cylinders
    this._markMeshes = Race.marks.map(m => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(7, 7, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xffcc00 })
      );
      mesh.position.set(m.x, 8, m.y);
      this._scene.add(mesh);
      return mesh;
    });

    // Course path
    const midX = (Race.gate.port.x + Race.gate.stbd.x) / 2;
    const midZ = Race.gate.port.y;
    this._scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(midX, 0.3, midZ),
        ...Race.marks.map(m => new THREE.Vector3(m.x, 0.3, m.y)),
        new THREE.Vector3(midX, 0.3, midZ),
      ]),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 })));

    // Boat placeholder
    const group = new THREE.Group();
    group.add(new THREE.Mesh(
      new THREE.BoxGeometry(WORLD_SCALE * 0.44, 2, WORLD_SCALE),
      new THREE.MeshBasicMaterial({ color: 0xdde8f0 })
    ));
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 10, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    mast.position.set(0, 6, -WORLD_SCALE * 0.25);
    group.add(mast);
    this._boatGroup = group;
    this._scene.add(group);
  },

  updateMeshes() {
    if (this._boatGroup) {
      this._boatGroup.position.set(Boat.x, 1, Boat.y);
      this._boatGroup.rotation.y = -Boat.heading;
    }
    Race.marks.forEach((m, i) => {
      const mesh = this._markMeshes[i];
      if (!mesh) return;
      mesh.material.color.setHex(
        m.rounded                                          ? 0x445566
          : (Race.wp === i + 1 && Race.phase === 'racing') ? 0xffffff
          : 0xffcc00
      );
    });
  },

  render() {
    this._renderer.render(this._scene, this._camera);
  },
};
