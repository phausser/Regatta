// Wasser – einfache Fläche plus instanzierte Dreiecks-Wellen
const WaterMesh = {
  _water:     null,
  _triangles: null,
  _uni:       null,
  _elapsed:   0,

  init(scene) {
    const waterMat = new THREE.MeshBasicMaterial({ color: 0x487cae });
    this._water = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000, 1, 1), waterMat);
    this._water.rotation.x = -Math.PI / 2;
    this._water.position.set(2500, -0.55, 2500);
    this._water.receiveShadow = false;
    scene.add(this._water);

    this._uni = {
      uTime:    { value: 0.0 },
      uWindDir: { value: Wind.dir },
    };

    this._triangles = new THREE.Mesh(this._buildTriangleGeometry(), new THREE.ShaderMaterial({
      uniforms:     this._uni,
      vertexShader: WaterMesh._triVert,
      fragmentShader: WaterMesh._triFrag,
      transparent:  true,
      depthWrite:   false,
      side:         THREE.DoubleSide,
    }));
    this._triangles.frustumCulled = false;
    this._triangles.renderOrder = 1;
    scene.add(this._triangles);
  },

  update(dt) {
    this._elapsed += dt;
    this._uni.uTime.value = this._elapsed;
    this._uni.uWindDir.value = Wind.dir;
  },

  _hash(x, y, salt) {
    const v = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
    return v - Math.floor(v);
  },

  _buildTriangleGeometry() {
    const cellLen = 240;
    const cellWid = 220;
    const cycle = 5;

    const alongMin = -2500;
    const alongMax = 8000;
    const crossMin = -2500;
    const crossMax = 8000;

    const alongs = [];
    const crosses = [];
    const delays = [];
    const sizes = [];
    const speeds = [];

    for (let ax = Math.floor(alongMin / cellLen); ax <= Math.ceil(alongMax / cellLen); ax++) {
      for (let cy = Math.floor(crossMin / cellWid); cy <= Math.ceil(crossMax / cellWid); cy++) {
        const count = Math.floor(this._hash(ax, cy, 91.7) * 4) + 1;
        const maxSize = 14 + this._hash(ax, cy, 5.1) * 7;
        const rowSpacing = maxSize * 1.15;
        const delay = this._hash(ax, cy, 43.1) * cycle;
        const speed = 28 + (this._hash(ax, cy, 12.9) - 0.5) * 4;

        for (let i = 0; i < count; i++) {
          alongs.push((ax + 0.5) * cellLen);
          crosses.push((cy + 0.5) * cellWid + (i - (count - 1) * 0.5) * rowSpacing);
          delays.push(delay);
          sizes.push(maxSize);
          speeds.push(speed);
        }
      }
    }

    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
    ], 3));
    geo.setAttribute('aCorner', new THREE.Float32BufferAttribute([0, 1, 2], 1));
    geo.setAttribute('aAlong', new THREE.InstancedBufferAttribute(new Float32Array(alongs), 1));
    geo.setAttribute('aCross', new THREE.InstancedBufferAttribute(new Float32Array(crosses), 1));
    geo.setAttribute('aDelay', new THREE.InstancedBufferAttribute(new Float32Array(delays), 1));
    geo.setAttribute('aMaxSize', new THREE.InstancedBufferAttribute(new Float32Array(sizes), 1));
    geo.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(new Float32Array(speeds), 1));
    geo.instanceCount = alongs.length;
    return geo;
  },

  _triVert: /* glsl */`
    uniform float uTime;
    uniform float uWindDir;

    attribute float aCorner;
    attribute float aAlong;
    attribute float aCross;
    attribute float aDelay;
    attribute float aMaxSize;
    attribute float aSpeed;

    varying float vAlpha;
    varying float vBright;

    void main() {
      float buildTime = 2.0;
      float breakTime = 3.0;
      float cycle = buildTime + breakTime;
      float life = mod(uTime + aDelay, cycle);

      float build = clamp(life / buildTime, 0.0, 1.0);
      float brk = clamp((life - buildTime) / breakTime, 0.0, 1.0);
      float breakElapsed = max(life - buildTime, 0.0);

      float grow = smoothstep(0.0, 1.0, build);
      float slide = smoothstep(0.0, 1.0, clamp(breakElapsed / 1.0, 0.0, 1.0));
      float shrink = smoothstep(0.0, 1.0, clamp(brk * 2.0 - 1.0, 0.0, 1.0));
      float size = life < buildTime ? mix(1.2, aMaxSize, grow) : mix(aMaxSize, 0.6, shrink);

      float h = size * 0.866025404;
      float firstHalf = clamp(slide * 2.0, 0.0, 1.0);
      float secondHalf = clamp(slide * 2.0 - 1.0, 0.0, 1.0);

      float tipX = mix(-h * 0.666666667, 0.0, firstHalf);
      tipX = mix(tipX, h * 0.666666667, secondHalf);
      float baseX = mix(h * 0.333333333, -h * 0.333333333, secondHalf);

      float localAlong = tipX;
      float localCross = 0.0;
      if (aCorner > 0.5) {
        localAlong = baseX;
        localCross = aCorner < 1.5 ? size * 0.5 : -size * 0.5;
      }

      float driftAlong = aSpeed * life;
      vec2 wto = vec2(sin(uWindDir), -cos(uWindDir));
      vec2 wperp = vec2(-wto.y, wto.x);
      vec2 worldXZ = wto * (aAlong + driftAlong + localAlong) + wperp * (aCross + localCross);

      vAlpha = life < buildTime ? 0.5 * build : 0.5;
      vBright = life < buildTime ? mix(0.08, 1.0, grow) : 1.0;

      gl_Position = projectionMatrix * viewMatrix * vec4(worldXZ.x, 0.12, worldXZ.y, 1.0);
    }
  `,

  _triFrag: /* glsl */`
    varying float vAlpha;
    varying float vBright;

    void main() {
      vec3 waterColor = vec3(0.282, 0.486, 0.682);
      vec3 triColor = mix(waterColor, vec3(0.90, 0.97, 1.0), vBright);
      gl_FragColor = vec4(triColor, vAlpha);
    }
  `,
};
