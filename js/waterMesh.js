// Wasser – kleine Dreiecke: entstehen in Luv, driften mit dem Wind und brechen weich
const WaterMesh = {
  _mesh:    null,
  _uni:     null,
  _elapsed: 0,

  init(scene) {
    this._uni = {
      uTime:      { value: 0.0 },
      uWindDir:   { value: Wind.dir },
      uWindSpeed: { value: Wind.speed },
    };

    const mat = new THREE.ShaderMaterial({
      uniforms:       this._uni,
      vertexShader:   WaterMesh._vert,
      fragmentShader: WaterMesh._frag,
    });

    const geo  = new THREE.PlaneGeometry(12000, 12000, 1, 1);
    this._mesh = new THREE.Mesh(geo, mat);
    this._mesh.rotation.x = -Math.PI / 2;
    this._mesh.position.set(2500, -0.5, 2500);
    this._mesh.receiveShadow = false;
    scene.add(this._mesh);
  },

  update(dt) {
    this._elapsed            += dt;
    this._uni.uTime.value      = this._elapsed;
    this._uni.uWindDir.value   = Wind.dir;
    this._uni.uWindSpeed.value = Wind.speed;
  },

  _vert: /* glsl */`
    varying vec2 vWorldXZ;

    void main() {
      vec3 p = position;
      vWorldXZ = (modelMatrix * vec4(p.xy, 0.0, 1.0)).xz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,

  _frag: /* glsl */`
    uniform float uTime;
    uniform float uWindDir;
    uniform float uWindSpeed;

    varying vec2 vWorldXZ;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float side(vec2 p, vec2 a, vec2 b) {
      vec2 ab = b - a;
      return ((ab.x * (p.y - a.y)) - (ab.y * (p.x - a.x))) / length(ab);
    }

    float equiTri(vec2 p, float size, float slide) {
      if (size < 0.9) return 0.0;

      float h = size * 0.866025404;
      float firstHalf  = clamp(slide * 2.0, 0.0, 1.0);
      float secondHalf = clamp(slide * 2.0 - 1.0, 0.0, 1.0);

      float tipX  = mix(-h * 0.666666667, 0.0, firstHalf);
      tipX        = mix(tipX, h * 0.666666667, secondHalf);

      float baseX = mix(h * 0.333333333, -h * 0.333333333, secondHalf);
      vec2 tip = vec2(tipX, 0.0);
      vec2 b1  = vec2(baseX,  size * 0.5);
      vec2 b2  = vec2(baseX, -size * 0.5);

      float orientation = sign(side(tip, b1, b2));
      float d1 = side(p, tip, b1) * orientation;
      float d2 = side(p, b1, b2)  * orientation;
      float d3 = side(p, b2, tip) * orientation;

      float aa = fwidth(p.x) + fwidth(p.y);
      return smoothstep(0.0, aa, min(min(d1, d2), d3));
    }

    vec3 waterTriangle(vec2 cellId, float along, float cross, float cellLen, float cellWid, float ws) {
      float buildTime = 2.0;
      float breakTime = 3.0;
      float cycle     = buildTime + breakTime;
      float life      = fract(uTime / cycle + hash(cellId + 43.1)) * cycle;

      float maxSize = 14.0 + hash(cellId + 5.1) * 7.0;
      float speed   = 28.0 + ws * 10.0;
      float count   = floor(hash(cellId + 91.7) * 4.0) + 1.0;

      float build = clamp(life / buildTime, 0.0, 1.0);
      float brk   = clamp((life - buildTime) / breakTime, 0.0, 1.0);
      float breakElapsed = max(life - buildTime, 0.0);

      float grow   = smoothstep(0.0, 1.0, build);
      float slide  = smoothstep(0.0, 1.0, clamp(breakElapsed / 1.0, 0.0, 1.0));
      float shrink = smoothstep(0.0, 1.0, clamp(brk * 2.0 - 1.0, 0.0, 1.0));
      float size   = life < buildTime ? mix(1.2, maxSize, grow) : mix(maxSize, 0.6, shrink);
      float bright = life < buildTime ? mix(0.08, 1.0, grow) : 1.0;
      float alpha  = life < buildTime ? 0.5 * build : 0.5;

      // Das Dreieck driftet konstant; beim Brechen wandert die Spitze zur Vorderseite.
      float driftAlong = speed * life;

      float rowSpacing = maxSize * 1.15;
      vec2 localPos = vec2(along, cross);
      float tri = 0.0;
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        if (fi < count) {
          float rowOffset = (fi - (count - 1.0) * 0.5) * rowSpacing;
          vec2 origin = vec2(
            (cellId.x + 0.5) * cellLen + driftAlong,
            (cellId.y + 0.5) * cellWid + rowOffset
          );
          tri = max(tri, equiTri(localPos - origin, size, slide));
        }
      }

      return vec3(tri, bright, alpha);
    }

    void main() {
      vec2 wto   = vec2(sin(uWindDir), -cos(uWindDir)); // Wind weht nach …
      vec2 wperp = vec2(-wto.y, wto.x);
      float ws   = uWindSpeed / 14.0;

      vec3 waterColor = vec3(0.282, 0.486, 0.682); // #487cae
      vec3 color = waterColor;

      float along = dot(vWorldXZ, wto);
      float cross = dot(vWorldXZ, wperp);

      float cellLen = 170.0;
      float cellWid = 150.0;
      vec2  baseCell = floor(vec2(along / cellLen, cross / cellWid));

      float tri = 0.0;
      float bright = 0.0;
      float alpha = 0.0;
      for (int ix = -3; ix <= 1; ix++) {
        for (int iy = -2; iy <= 2; iy++) {
          vec2 sampleCell = baseCell + vec2(float(ix), float(iy));
          vec3 sampleTri  = waterTriangle(sampleCell, along, cross, cellLen, cellWid, ws);
          if (sampleTri.x > tri) {
            tri = sampleTri.x;
            bright = sampleTri.y;
            alpha = sampleTri.z;
          }
        }
      }

      vec3 triColor = mix(waterColor, vec3(0.90, 0.97, 1.0), bright);
      color = mix(color, triColor, tri * alpha);

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};
