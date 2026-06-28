const MarksMesh = {
  _group:      null,
  _gateLine:   null,
  _courseLine: null,
  _gate:       {},
  _gateShadows: [],
  _marks:      [],
  _rings:      [],

  init(scene) {
    this._group = new THREE.Group();
    this._buildGate();
    this._buildMarks();
    this._buildCoursePath();
    scene.add(this._group);
    this._group.traverse(obj => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
    });
  },

  _buildGate() {
    this._gate.port = this._gatePost(Race.gate.port.x, Race.gate.port.y, 0xff3344);
    this._gate.stbd = this._gatePost(Race.gate.stbd.x, Race.gate.stbd.y, 0x33ee66);

    this._gateLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Race.gate.port.x, 2.2, Race.gate.port.y),
        new THREE.Vector3(Race.gate.stbd.x, 2.2, Race.gate.stbd.y),
      ]),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 }),
    );
    this._group.add(this._gateLine);
  },

  _gatePost(x, z, color) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(7, 7, 26, 12),
      new THREE.MeshStandardMaterial({ color, roughness: 0.48 }),
    );
    post.position.set(x, 13, z);
    this._group.add(post);

    const shadow = this._shadowDisc(15, 0.20);
    shadow.position.set(x + 3, 0.14, z + 4);
    this._group.add(shadow);
    this._gateShadows.push(shadow);

    return post;
  },

  _buildMarks() {
    this._marks = Race.marks.map(mark => {
      const buoy = new THREE.Group();

      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(11, 15, 18, 16),
        new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.55 }),
      );
      body.position.y = 9;
      buoy.add(body);

      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 10, 7, 16),
        new THREE.MeshStandardMaterial({ color: 0xffe080, roughness: 0.50 }),
      );
      cap.position.y = 21.5;
      buoy.add(cap);

      buoy.position.set(mark.x, 0, mark.y);
      this._group.add(buoy);

      const ring = this._markRing(mark);
      this._group.add(ring);
      this._rings.push(ring);

      const shadow = this._shadowDisc(24, 0.24);
      shadow.position.set(mark.x + 4, 0.14, mark.y + 6);
      shadow.scale.set(1.25, 0.72, 1);
      this._group.add(shadow);

      return { buoy, body, cap, shadow };
    });
  },

  _shadowDisc(radius, opacity) {
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 32),
      new THREE.MeshBasicMaterial({
        color: 0x12314a,
        transparent: true,
        opacity,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.renderOrder = 2;
    return shadow;
  },

  _markRing(mark) {
    const ring = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(this._circlePoints(mark.x, mark.y, mark.radius, 80)),
      new THREE.LineBasicMaterial({ color: 0xffdc50, transparent: true, opacity: 0 }),
    );
    return ring;
  },

  _circlePoints(x, z, radius, segments) {
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        x + Math.cos(a) * radius,
        1.4,
        z + Math.sin(a) * radius,
      ));
    }
    return pts;
  },

  _buildCoursePath() {
    const midX = (Race.gate.port.x + Race.gate.stbd.x) / 2;
    const midZ = Race.gate.port.y;
    this._courseLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(midX, 1.2, midZ),
        ...Race.marks.map(m => new THREE.Vector3(m.x, 1.2, m.y)),
        new THREE.Vector3(midX, 1.2, midZ),
      ]),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 }),
    );
    this._group.add(this._courseLine);
  },

  update() {
    const t = performance.now() * 0.001;

    this._gateLine.material.opacity = Race.phase === 'finished' ? 0.45 : 0.25;
    this._gateLine.material.color.setHex(Race.phase === 'finished' ? 0x33ee66 : 0xffffff);

    this._marks.forEach((entry, i) => {
      const mark = Race.marks[i];
      const isNext = Race.wp === i + 1 && Race.phase === 'racing';
      const bob = Math.sin(t * 2.2 + i * 1.7) * 2.0;
      const color = mark.rounded ? 0x445566 : (isNext ? 0xffffff : 0xffcc00);

      entry.buoy.position.set(mark.x, bob, mark.y);
      entry.body.material.color.setHex(color);
      entry.cap.material.color.setHex(mark.rounded ? 0x667788 : (isNext ? 0xfff5c0 : 0xffe080));

      const ring = this._rings[i];
      ring.material.opacity = isNext ? 0.30 + Math.sin(t * 4.0) * 0.12 : 0;
    });
  },
};
