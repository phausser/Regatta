// Sfx – synthesized sound via Web Audio API
// AudioContext wird beim ersten Update nach User-Interaktion erstellt (Autoplay-Policy)
const Sfx = {
  muted: false,
  _ctx:        null,
  _master:     null,

  // Continuous noise layers
  _windGain:   null,
  _windFilter: null,
  _waveGain:   null,
  _waveFilter: null,
  _luffGain:   null,

  // ── Init (lazy) ────────────────────────────────────────────────────────────
  _ensureCtx() {
    if (this._ctx) {
      if (this._ctx.state === 'suspended') this._ctx.resume();
      return true;
    }
    try {
      this._ctx = new AudioContext();
      this._build();
      return true;
    } catch { return false; }
  },

  _makeNoiseBuf() {
    const sr  = this._ctx.sampleRate;
    const buf = this._ctx.createBuffer(1, sr * 3, sr); // 3 s loop
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  },

  _loopNoise(buf, detune) {
    const src = this._ctx.createBufferSource();
    src.buffer       = buf;
    src.loop         = true;
    src.detune.value = detune;
    src.start();
    return src;
  },

  _build() {
    const ctx = this._ctx;
    const buf = this._makeNoiseBuf();

    this._master = ctx.createGain();
    this._master.gain.value = 0.65;
    this._master.connect(ctx.destination);

    // ── Wind ambient: bandpass rauschen ──────────────────────────────────────
    const windSrc       = this._loopNoise(buf, 0);
    this._windFilter    = ctx.createBiquadFilter();
    this._windFilter.type          = 'bandpass';
    this._windFilter.frequency.value = 320;
    this._windFilter.Q.value         = 0.7;
    this._windGain      = ctx.createGain();
    this._windGain.gain.value = 0;
    windSrc.connect(this._windFilter);
    this._windFilter.connect(this._windGain);
    this._windGain.connect(this._master);

    // ── Bugwellen / Fahrtgeräusch: lowpass rumble ─────────────────────────
    const waveSrc       = this._loopNoise(buf, -1200); // tiefer
    this._waveFilter    = ctx.createBiquadFilter();
    this._waveFilter.type            = 'lowpass';
    this._waveFilter.frequency.value = 120;
    this._waveGain      = ctx.createGain();
    this._waveGain.gain.value = 0;
    waveSrc.connect(this._waveFilter);
    this._waveFilter.connect(this._waveGain);
    this._waveGain.connect(this._master);

    // ── Segel-Flattern: höherer bandpass mit LFO-Modulation ──────────────
    const luffSrc    = this._loopNoise(buf, 800);
    const luffFilter = ctx.createBiquadFilter();
    luffFilter.type            = 'bandpass';
    luffFilter.frequency.value = 1100;
    luffFilter.Q.value         = 1.8;

    // LFO: 3-5 Hz Flatter-Modulation auf Lautst. des Luff-Layers
    this._luffGain   = ctx.createGain();
    this._luffGain.gain.value = 0;
    const lfoOsc     = ctx.createOscillator();
    const lfoGain    = ctx.createGain();
    lfoOsc.type            = 'sine';
    lfoOsc.frequency.value = 3.8;
    lfoGain.gain.value     = 0.12;  // LFO-Tiefe
    lfoOsc.connect(lfoGain);
    lfoGain.connect(this._luffGain.gain); // moduliert Lautstärke
    lfoOsc.start();

    luffSrc.connect(luffFilter);
    luffFilter.connect(this._luffGain);
    this._luffGain.connect(this._master);
  },

  // ── Per-Frame Update ───────────────────────────────────────────────────────
  update(boat, wind) {
    if (!this._ensureCtx()) return;
    const now = this._ctx.currentTime;

    if (this.muted) {
      this._master.gain.setTargetAtTime(0, now, 0.05);
      return;
    }
    this._master.gain.setTargetAtTime(0.65, now, 0.05);

    // Wind: Lautstärke + Filterfrequenz mit Windstärke
    const windVol = Math.min(0.38, wind.speed / 20 * 0.38);
    this._windGain.gain.setTargetAtTime(windVol, now, 0.4);
    this._windFilter.frequency.setTargetAtTime(200 + wind.speed * 9, now, 0.6);

    // Bugwellen: proportional zur Bootsgeschwindigkeit
    const waveVol = Math.min(0.28, boat.speed / 14 * 0.28);
    this._waveGain.gain.setTargetAtTime(waveVol, now, 0.25);
    this._waveFilter.frequency.setTargetAtTime(70 + boat.speed * 9, now, 0.3);

    // Segel-Flattern: nur wenn luffing
    const luffVol = boat.sailState === 'luffing' ? 0.22 : 0;
    this._luffGain.gain.setTargetAtTime(luffVol, now, 0.08);
  },

  // ── One-shot Sounds ────────────────────────────────────────────────────────
  playBuoyPing() {
    if (!this._ensureCtx() || this.muted) return;
    const ctx = this._ctx;
    // Kurzes Metallklang-Ping (sine + etwas 2. Harmonische)
    [[880, 0.28], [1760, 0.08]].forEach(([freq, vol]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(this._master);
      osc.start();
      osc.stop(ctx.currentTime + 0.56);
    });
  },

  playFinish() {
    if (!this._ensureCtx() || this.muted) return;
    const ctx = this._ctx;
    // Kleines C-Dur Arpeggio aufwärts: C5 E5 G5 C6
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.16;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.22, t0 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.65);
      osc.connect(gain);
      gain.connect(this._master);
      osc.start(t0);
      osc.stop(t0 + 0.66);
    });
  },

  toggleMute() {
    this.muted = !this.muted;
  },
};
