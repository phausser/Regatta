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
  _sailMesh: null,
  _partMat:  null,
  _partAttr: null,

  init(scene) {
    this._group = new THREE.Group();
    this._buildHull();
    this._buildMast();
    this._buildSail();
    this._buildBowWave();
    this._group.traverse(obj => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
    });
    if (this._sailMesh) this._sailMesh.receiveShadow = false;
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
      new THREE.MeshStandardMaterial({ color: 0xe8f0f5, roughness: 0.62, metalness: 0.02 }),
    );
    hull.rotation.x = -Math.PI / 2;
    this._group.add(hull);

    // Cabin coach-roof: narrow box along centerline
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(HW * 0.65, 0.8, HL * 0.85),
      new THREE.MeshStandardMaterial({ color: 0xf6fbff, roughness: 0.55 }),
    );
    roof.position.set(0, 2.8, _B.MZ + HL * 0.18);
    this._group.add(roof);

    // Teak deck color (darker warm strip around edges – implied by hull tint)
    // Keel centerline stripe
    const keel = new THREE.Mesh(
      new THREE.BoxGeometry(HW * 0.22, 0.1, HL * 0.80 + HS * 0.50),
      new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.80 }),
    );
    keel.position.set(0, 2.05, (HL * 0.80 - HS * 0.50) * -0.5 + HS * 0.05);
    this._group.add(keel);
  },

  // ── Mast ────────────────────────────────────────────────────────────────────
  _buildMast() {
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 10, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 }),
    );
    mast.position.set(0, 7, _B.MZ);
    this._group.add(mast);
  },

  // ── Sail (quad planform, updated each frame) ─────────────────────────────
  _buildSail() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    this._sailAttr = geo.attributes.position;
    this._sailMat  = new THREE.MeshStandardMaterial({
      color: 0x44ff88, side: THREE.DoubleSide,
      roughness: 0.32, metalness: 0.0,
      emissive: 0x1a8844, emissiveIntensity: 1.0,
    });
    this._sailMesh = new THREE.Mesh(geo, this._sailMat);
    this._sailMesh.renderOrder = 2;
    this._sailMesh.castShadow    = true;
    this._sailMesh.receiveShadow = false;
    this._group.add(this._sailMesh);
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
    const SAIL_H  = 8.6;
    const sailLen = HS * 1.10 * (Boat.reefed ? 0.62 : 1.0);
    const side    = Boat.awa >= 0 ? -1 : 1;
    const angle   = side * Boat.trimAngle;
    const boomX   = Math.sin(angle) * sailLen;
    const boomDZ  = Math.cos(angle) * sailLen;
    const bMag    = Math.hypot(boomX, boomDZ) || 1e-6;
    const nX      = boomX / bMag;
    const nZ      = boomDZ / bMag;
    const pX      = -nZ;
    const pZ      = nX;
    const halfW   = Math.max(3.4, sailLen * 0.30);
    const bellyD  = sailLen * 0.32 * Math.max(0.12, Boat.trimEff);
    const luffAmt = Boat.sailState === 'luffing'
      ? 0.35 + Math.max(0, Math.sin(performance.now() * 0.0065)) * 0.65 : 1.0;

    const luffX = -side * pX * halfW * 0.35;
    const luffZ = -side * pZ * halfW * 0.35;
    const leeX  = boomX + side * pX * halfW + side * bellyD * luffAmt * 0.5;
    const leeZ  = MZ + boomDZ + side * pZ * halfW + side * bellyD * luffAmt * 0.15;
    const leeMidX = boomX * 0.52 + side * pX * halfW * 0.65 + side * bellyD * luffAmt;
    const leeMidZ = MZ + boomDZ * 0.52 + side * pZ * halfW * 0.65;

    const a = this._sailAttr;
    a.setXYZ(0, luffX,                    SAIL_H, MZ + luffZ);          // luff foot
    a.setXYZ(1, 0,                        SAIL_H, MZ);                  // mast / tack
    a.setXYZ(2, leeMidX,                  SAIL_H, leeMidZ);             // belly
    a.setXYZ(3, leeX,                     SAIL_H, leeZ);                // clew / leech
    a.needsUpdate = true;
    this._sailMesh.geometry.computeVertexNormals();

    const good = Boat.sailState === 'good';
    this._sailMat.color.setHex(good ? 0x44ff88 : 0xff3d4a);
    this._sailMat.emissive.setHex(good ? 0x1a8844 : 0x881820);
    this._sailMat.emissiveIntensity = good ? 1.0 : (Boat.sailState === 'luffing' ? 1.35 : 1.15);
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
