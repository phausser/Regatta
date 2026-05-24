// Renderer – Wasser, Partikel, Wind-Kompass
const Renderer = {

  _waveT: 0,   // kontinuierliche Wellen-Zeit
  _particles: [],
  _spawnAccum: 0,

  // ── Init ───────────────────────────────────────────────────────────────────
  init() {
    this._particles = [];
    this._spawnAccum = 0;
    this._waveT = 0;
  },

  // ── Update ─────────────────────────────────────────────────────────────────
  update(dt, boat) {
    this._waveT += dt;
    this._spawnBowWake(dt, boat);
    this._tickParticles(dt);
  },

  // ── Hintergrund: Wasser-Kacheln + Wellenlinien ────────────────────────────
  drawBackground(ctx, canvas) {
    // Basisfarbe (leicht windabhängig)
    const wf = Math.min(1, Wind.speed / 18);
    const r = Math.round(8  + wf * 5);
    const g = Math.round(52 + wf * 14);
    const b = Math.round(120 + wf * 20);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this._drawWaterTiles(ctx, canvas);
    this._drawWaveLines(ctx, canvas);
    this._drawGrid(ctx, canvas);
  },

  // Welt-Kacheln mit sinus-animierter Helligkeit
  _drawWaterTiles(ctx, canvas) {
    const TILE = 160;  // Welt-Einheiten pro Kachel
    const t = this._waveT;
    const wf = Math.min(1, Wind.speed / 18);
    const tl = Camera.toWorld(0, 0, canvas);
    const br = Camera.toWorld(canvas.width, canvas.height, canvas);
    const tileS = TILE * Camera.zoom + 1;

    for (let wx = Math.floor(tl.x / TILE) * TILE; wx < br.x + TILE; wx += TILE) {
      for (let wy = Math.floor(tl.y / TILE) * TILE; wy < br.y + TILE; wy += TILE) {
        const v = Math.sin(wx * 0.006 + wy * 0.004 + t * 0.35) * 0.5 + 0.5;
        const rv = Math.round(8  + v * 6  + wf * 5);
        const gv = Math.round(52 + v * 14 + wf * 12);
        const bv = Math.round(120 + v * 22 + wf * 18);
        const s = Camera.toScreen(wx, wy, canvas);
        ctx.fillStyle = `rgb(${rv},${gv},${bv})`;
        ctx.fillRect(s.x, s.y, tileS, tileS);
      }
    }
  },

  // Wellenlinien senkrecht zur Windrichtung, scrollend
  _drawWaveLines(ctx, canvas) {
    const SPACING = 70;   // Welt-Einheiten zwischen Linien
    const AMP = 4;    // Wellen-Amplitude in Welt-Einheiten
    const DRIFT = 22;   // Driftgeschwindigkeit WE/s

    // Windvektor im Screen-Raum (y nach unten)
    const wx = Math.sin(Wind.dir);
    const wy = -Math.cos(Wind.dir);
    // Senkrecht dazu (Wellenfront-Richtung)
    const px = -wy;
    const py = wx;

    const sc = Camera.zoom;
    const spacing = SPACING * sc;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const diag = Math.hypot(canvas.width, canvas.height);

    // Phase: Zeit-Drift minus Kamera-Projektion → Linien bleiben in der Welt verankert
    const camProj = (Camera.x * wx + Camera.y * wy) * sc;
    const phase = ((this._waveT * DRIFT * sc - camProj) % spacing + spacing) % spacing;

    ctx.save();
    ctx.strokeStyle = 'rgba(140,200,255,0.16)';
    ctx.lineWidth = 1.2;

    for (let d = -diag + phase; d < diag + spacing; d += spacing) {
      ctx.beginPath();
      let first = true;
      for (let s = -diag; s <= diag; s += 12) {
        const wave = AMP * sc * Math.sin(s * 0.018 + this._waveT * 1.6 + d * 0.01);
        const sx = cx + px * s + wx * (d + wave);
        const sy = cy + py * s + wy * (d + wave);
        if (first) { ctx.moveTo(sx, sy); first = false; }
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
    ctx.restore();
  },

  // 500-WE-Gitter (aus main.js übernommen)
  _drawGrid(ctx, canvas) {
    const GRID = 500;
    const tl = Camera.toWorld(0, 0, canvas);
    const br = Camera.toWorld(canvas.width, canvas.height, canvas);
    const x0 = Math.floor(tl.x / GRID) * GRID;
    const y0 = Math.floor(tl.y / GRID) * GRID;

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let gx = x0; gx <= br.x + GRID; gx += GRID) {
      const s = Camera.toScreen(gx, 0, canvas);
      ctx.beginPath(); ctx.moveTo(s.x, 0); ctx.lineTo(s.x, canvas.height); ctx.stroke();
    }
    for (let gy = y0; gy <= br.y + GRID; gy += GRID) {
      const s = Camera.toScreen(0, gy, canvas);
      ctx.beginPath(); ctx.moveTo(0, s.y); ctx.lineTo(canvas.width, s.y); ctx.stroke();
    }
  },

  // ── Bugwellen-Partikel ────────────────────────────────────────────────────
  _spawnBowWake(dt, boat) {
    if (boat.speed < 1.0) { this._spawnAccum = 0; return; }

    const rate = 3 + boat.speed * 1.5;
    this._spawnAccum += rate * dt;

    // Bugposition in der Welt
    const bx = boat.x + Math.sin(boat.heading) * WORLD_SCALE * 0.45;
    const by = boat.y - Math.cos(boat.heading) * WORLD_SCALE * 0.45;

    while (this._spawnAccum >= 1) {
      this._spawnAccum -= 1;
      // Port- und Steuerbord-Fächer
      for (const side of [-1, 1]) {
        const spread = boat.heading + side * (0.6 + Math.random() * 0.4);
        const spd = boat.speed * (0.25 + Math.random() * 0.2);
        this._particles.push({
          x: bx + (Math.random() - 0.5) * 3,
          y: by + (Math.random() - 0.5) * 3,
          vx: Math.sin(spread) * spd,
          vy: -Math.cos(spread) * spd,
          life: 1.0,
          maxLife: 0.7 + Math.random() * 0.8,
        });
      }
    }

    if (this._particles.length > 250) this._particles.splice(0, this._particles.length - 250);
  },

  _tickParticles(dt) {
    const FRICTION = 2.5;
    for (const p of this._particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.max(0, 1 - FRICTION * dt);
      p.vy *= Math.max(0, 1 - FRICTION * dt);
      p.life -= dt / p.maxLife;
    }
    this._particles = this._particles.filter(p => p.life > 0);
  },

  drawParticles(ctx, canvas) {
    if (this._particles.length === 0) return;
    ctx.save();
    for (const p of this._particles) {
      const s = Camera.toScreen(p.x, p.y, canvas);
      const r = Math.max(0.8, 2.2 * Camera.zoom * p.life);
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,230,255,${(p.life * 0.65).toFixed(2)})`;
      ctx.fill();
    }
    ctx.restore();
  },

  // ── Wind-Kompass HUD (unten rechts) ───────────────────────────────────────
  drawWindCompass(ctx, canvas) {
    const R = 46;
    const PAD = 14;
    const cx = canvas.width - R - PAD;
    const cy = canvas.height - R - PAD - 28;  // 28px Platz für Text darunter

    // Hintergrund
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R + 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fill();

    // Ring
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Himmelsrichtungen
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    [['N', 0, -1], ['O', 1, 0], ['S', 0, 1], ['W', -1, 0]].forEach(([l, dx, dy]) => {
      ctx.fillText(l, cx + dx * (R - 9), cy + dy * (R - 9));
    });

    // True-Wind Pfeil (cyan, länger)
    this._compassArrow(ctx, cx, cy, R * 0.82, Wind.dir, '#00e5ff', 2.5);

    // Apparent-Wind Pfeil (orange, kürzer)
    const awDir = Math.atan2(Boat.awvx, -Boat.awvy);  // Kompesskurs der AW-Vektors
    this._compassArrow(ctx, cx, cy, R * 0.62, awDir, '#ff9800', 2.0);

    // Beschriftung
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '10px monospace';

    const twFrom = Wind.fromDeg().toFixed(0).padStart(3);
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(`TW ${twFrom}°  ${Wind.speed.toFixed(0)} kn`, cx - R, cy + R + 14);

    const awaDeg = (Math.abs(Boat.awa) * 180 / Math.PI).toFixed(0).padStart(3);
    const awaDir = Boat.awa >= 0 ? 'S' : 'B';  // S=Steuerbord, B=Backbord
    ctx.fillStyle = '#ff9800';
    ctx.fillText(`AW ${awaDeg}°${awaDir} ${Boat.awSpeed.toFixed(0)} kn`, cx - R, cy + R + 26);

    ctx.restore();
  },

  _compassArrow(ctx, cx, cy, len, dir, color, lw) {
    // dir = Kompassrichtung (0=N, CW, Radiant); Pfeil zeigt dorthin
    const ex = cx + Math.sin(dir) * len;
    const ey = cy - Math.cos(dir) * len;
    const tx = cx - Math.sin(dir) * len * 0.18;  // kleiner Schaft-Rückwärtspunkt
    const ty = cy + Math.cos(dir) * len * 0.18;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lw;
    ctx.globalAlpha = 0.88;

    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    const hl = len * 0.24;
    const a = Math.atan2(ey - ty, ex - tx);
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - hl * Math.cos(a - 0.42), ey - hl * Math.sin(a - 0.42));
    ctx.lineTo(ex - hl * Math.cos(a + 0.42), ey - hl * Math.sin(a + 0.42));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  },
};
