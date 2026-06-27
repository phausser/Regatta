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

    const geo  = new THREE.PlaneGeometry(12000, 12000, 128, 128);
    this._mesh = new THREE.Mesh(geo, mat);
    this._mesh.rotation.x = -Math.PI / 2;
    this._mesh.position.set(2500, -0.5, 2500);
    scene.add(this._mesh);
  },

  update(dt) {
    this._elapsed       += dt;
    this._uni.uTime.value      = this._elapsed;
    this._uni.uWindDir.value   = Wind.dir;
    this._uni.uWindSpeed.value = Wind.speed;
  },

  // PlaneGeometry lies in XY; rotation.x=-PI/2 maps: local-x→world-X, local-y→(-world-Z)
  // Wind in local XY: wx=sin(dir), wy=cos(dir)  (matches canvas→Three.js mapping)
  // Wave displacement goes in local Z (→ world Y, height)
  _vert: /* glsl */`
    uniform float uTime;
    uniform float uWindDir;
    uniform float uWindSpeed;

    varying float vWaveHeight;
    varying vec2  vPos;

    void main() {
      vec3 p = position;

      float wx = sin(uWindDir);
      float wy = cos(uWindDir);
      float ws = uWindSpeed / 8.0;

      float w1 = sin(p.x * 0.010 * wx + p.y * 0.010 * wy - uTime * 0.70       ) * 0.28;
      float w2 = sin(p.x * 0.016 * wy - p.y * 0.016 * wx - uTime * 1.10 + 1.30) * 0.16;
      float w3 = sin(p.x * 0.006       + p.y * 0.022       + uTime * 0.45 + 2.80) * 0.10;

      float wh = (w1 + w2 + w3) * ws;
      p.z += wh;

      vWaveHeight = wh / 0.54;
      vPos = p.xy;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,

  _frag: /* glsl */`
    uniform float uTime;
    uniform float uWindDir;
    uniform float uWindSpeed;

    varying float vWaveHeight;
    varying vec2  vPos;

    void main() {
      float wx = sin(uWindDir);
      float wy = cos(uWindDir);

      vec2  uv = vPos * 0.004;
      float r1 = sin(uv.x * wx * 4.0 + uv.y * wy * 4.0 - uTime * 0.90       ) * 0.5 + 0.5;
      float r2 = sin(uv.x * 3.00      - uv.y * 2.00      + uTime * 0.55 + 1.60) * 0.5 + 0.5;
      float ripple = r1 * 0.6 + r2 * 0.4;

      float crest = clamp(vWaveHeight * 0.5 + 0.5, 0.0, 1.0);
      crest = mix(crest, ripple, 0.4);

      vec3 deep = vec3(0.030, 0.190, 0.440);
      vec3 mid  = vec3(0.055, 0.295, 0.600);
      vec3 foam = vec3(0.880, 0.930, 1.000);

      vec3 color = mix(deep, mid, ripple * 0.55);

      float foamAmt = smoothstep(0.70, 0.92, crest) * smoothstep(4.0, 12.0, uWindSpeed);
      color = mix(color, foam, foamAmt * 0.45);

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};
