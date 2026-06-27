// Boat hull shape constants (all in local-Z/X boat frame)
// Coordinate system after Rx(-π/2): shape-Y+ → local-Z- (forward), shape-Z+ → local-Y+ (up)
// So: bow at local Z = -HL, stern at local Z = +HS, local X = port/stbd

const _B = {
  HL:  WORLD_SCALE * 0.50,  // 10   – how far bow is forward of group origin
  HS:  WORLD_SCALE * 0.45,  //  9   – how far stern is aft of group origin
  HW:  WORLD_SCALE * 0.14,  //  2.8 – max half-beam (L/B ≈ 3.4 : 1)
  SW:  WORLD_SCALE * 0.095, //  1.9 – stern half-width
  BY:  WORLD_SCALE * 0.05,  //  1.0 – shape-Y of max beam (slightly aft of center)
  MZ: -WORLD_SCALE * 0.12,  // -2.4 – local Z of mast (40 % from bow)
};

const BoatMesh = {
  _group:    null,
  _sailMat:  null,
  _sailAttr: null,
  _partMat:  null,
  _partAttr: null,

  init(scene) {
    this._group = new THREE.Group();
    this._buildHull();
    this._buildMast();
    this._buildSail();
    this._buildBowWave();
    scene.add(this._group);
  },

  // ── Hull ────────────────────────────────────────────────────────────────────
  // Shape in XY (before Rx(-π/2)): Y+ = forward, X+ = starboard.
  // CCW winding → back-cap normal = +Z → after Rx(-π/2) → +Y (faces camera). ✓
  // Path: bow → port side aft → stern port → stern stbd → stbd side forward → bow
  _buildHull() {
    const { HL, HS, HW, SW, BY } = _B;

    const shape = new THREE.Shape();
    shape.moveTo(0, HL);  // bow tip

    // Port side (bow aft → max beam → stern corner)
    shape.bezierCurveTo(
      -HW * 0.35, HL * 0.75,      // cp1 – bow flare starts
      -HW,         BY + HS * 0.25, // cp2 – reaching max beam
      -HW,         BY              // max beam (port)
    );
    shape.bezierCurveTo(
      -HW,         -HS * 0.65,     // cp1 – hold width going aft
      -SW * 1.15,  -HS + HS * 0.08,// cp2 – approaching stern corner
      -SW,         -HS             // stern port corner
    );

    // Stern transom (straight, port → stbd)
    shape.lineTo(SW, -HS);

    // Stbd side (stern corner → max beam → bow)
    shape.bezierCurveTo(
      SW * 1.15,  -HS + HS * 0.08,
      HW,         -HS * 0.65,
      HW,         BY
    );
    shape.bezierCurveTo(
      HW,         BY + HS * 0.25,
      HW * 0.35,  HL * 0.75,
      0,          HL
    );
    shape.closePath();

    const hull = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: false }),
      new THREE.MeshBasicMaterial({ color: 0xd8e8f2 }),
    );
    hull.rotation.x = -Math.PI / 2;
    this._group.add(hull);

    // Cabin coach-roof: narrow box along centerline
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(HW * 0.65, 0.8, HL * 0.85),
      new THREE.MeshBasicMaterial({ color: 0xeef4f8 }),
    );
    roof.position.set(0, 2.8, _B.MZ + HL * 0.18);
    this._group.add(roof);

    // Teak deck color (darker warm strip around edges – implied by hull tint)
    // Keel centerline stripe
    const keel = new THREE.Mesh(
      new THREE.BoxGeometry(HW * 0.22, 0.1, HL * 0.80 + HS * 0.50),
      new THREE.MeshBasicMaterial({ color: 0x3a4a5a }),
    );
    keel.position.set(0, 2.05, (HL * 0.80 - HS * 0.50) * -0.5 + HS * 0.05);
    this._group.add(keel);
  },

  // ── Mast ────────────────────────────────────────────────────────────────────
  _buildMast() {
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 10, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    mast.position.set(0, 7, _B.MZ);
    this._group.add(mast);
  },

  // ── Sail (3-vertex dynamic triangle, updated each frame) ───────────────────
  _buildSail() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
    geo.setIndex([0, 1, 2]);
    this._sailAttr = geo.attributes.position;
    this._sailMat  = new THREE.MeshBasicMaterial({
      color: 0xfffcb9, side: THREE.DoubleSide, transparent: true, opacity: 0.88,
    });
    this._group.add(new THREE.Mesh(geo, this._sailMat));
  },

  // ── Bow-wave particles ─────────────────────────────────────────────────────
  _buildBowWave() {
    const N   = 40;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    this._partAttr = geo.attributes.position;
    this._partMat  = new THREE.PointsMaterial({
      color: 0xc0d8ff, size: 2.0, transparent: true, opacity: 0,
    });
    const pts = new THREE.Points(geo, this._partMat);
    pts.position.y = 2.6;
    this._group.add(pts);
  },

  // ── Per-frame update ────────────────────────────────────────────────────────
  update() {
    this._group.position.set(Boat.x, 1, Boat.y);
    this._group.rotation.y = -Boat.heading;
    this._updateSail();
    this._updateBowWave();
  },

  _updateSail() {
    const { MZ, HS } = _B;
    const SAIL_H  = 8;                                       // sail sits at y=8 (mast height)
    const sailLen = HS * 1.10 * (Boat.reefed ? 0.62 : 1.0); // boom length ≈ distance mast→stern
    const side    = Boat.awa >= 0 ? -1 : 1;                  // leeward side
    const angle   = side * Boat.trimAngle;
    const boomX   = Math.sin(angle) * sailLen;
    const boomDZ  = Math.cos(angle) * sailLen;               // aft from mast (+Z)
    const bellyD  = sailLen * 0.26 * Math.max(0.05, Boat.trimEff);
    const luffAmt = Boat.sailState === 'luffing'
      ? Math.max(0, Math.sin(performance.now() * 0.0055)) * 0.8 : 1.0;

    const a = this._sailAttr;
    a.setXYZ(0,  0,                          SAIL_H, MZ);             // mast (tack)
    a.setXYZ(1,  boomX * 0.5 + side * bellyD * luffAmt, SAIL_H, MZ + boomDZ * 0.5); // belly
    a.setXYZ(2,  boomX,                      SAIL_H, MZ + boomDZ);    // clew
    a.needsUpdate = true;

    const colors = { good: 0xfffcb9, luffing: 0xff6e46, overtrimmed: 0xffd250 };
    this._sailMat.color.setHex(colors[Boat.sailState] ?? 0xfffcb9);
  },

  _updateBowWave() {
    const bowZ  = -_B.HL;
    const spd   = Boat.speed;
    const count = Math.min(40, Math.floor(spd * 2.5));
    const arr   = this._partAttr.array;
    const t     = performance.now() * 0.001;

    for (let i = 0; i < 40; i++) {
      if (i < count) {
        const side = i % 2 === 0 ? 1 : -1;
        const frac = Math.floor(i / 2) / 20;
        const ang  = 0.28 + frac * 0.70;                         // fan: ~16°–56° from bow
        const r    = (0.5 + frac * 2.0) * spd * 0.30 + Math.sin(t * 3 + i) * 0.3;
        arr[i * 3]     = side * Math.sin(ang) * r;
        arr[i * 3 + 1] = 0;
        arr[i * 3 + 2] = bowZ + frac * _B.HL * 0.7;             // trail aft along hull
      } else {
        arr[i * 3] = arr[i * 3 + 1] = arr[i * 3 + 2] = 0;
      }
    }
    this._partAttr.needsUpdate = true;
    this._partMat.opacity = Math.min(0.60, spd * 0.055);
  },
};
