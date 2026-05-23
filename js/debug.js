// Debug overlay – toggle with D key
const Debug = {
  enabled: false,

  update() {
    if (Input.isPressed('KeyD')) this.enabled = !this.enabled;
  },

  draw(ctx, canvas, state) {
    if (!this.enabled) return;

    const hdgDeg   = (Boat.heading * 180 / Math.PI).toFixed(0).padStart(3);
    const awaDeg   = (Math.abs(Boat.awa) * 180 / Math.PI).toFixed(0);
    const awaDir   = Boat.awa >= 0 ? 'STBD' : 'PORT';
    const trimDeg  = (Boat.trimAngle * 180 / Math.PI).toFixed(0);
    const stateStr = { good: 'OK ✓', luffing: 'LUFF ↓', overtrimmed: 'TIGHT ↑' }[Boat.sailState];
    const reefStr  = Boat.reefed ? 'REEF' : 'full';

    const lines = [
      'DEBUG  (D = toggle)',
      `FPS:   ${state.fps.toFixed(0)}`,
      `Cam:   ${Camera.x.toFixed(0)}, ${Camera.y.toFixed(0)}   z${Camera.zoom.toFixed(2)}`,
      '─────────────────',
      `Pos:   ${Boat.x.toFixed(0)}, ${Boat.y.toFixed(0)}`,
      `Hdg:   ${hdgDeg}°`,
      `Speed: ${Boat.speed.toFixed(1)} kn`,
      '─────────────────',
      `Trim:  ${trimDeg}°  ${stateStr}`,
      `Eff:   ${(Boat.trimEff * 100).toFixed(0)}%  ${reefStr}`,
      `AWA:   ${awaDeg}° ${awaDir}`,
      `AWS:   ${Boat.awSpeed.toFixed(1)} kn`,
      '─────────────────',
      `TWD:   ${Wind.fromDeg().toFixed(0)}° (from)`,
      `TWS:   ${Wind.speed.toFixed(1)} kn`,
    ];

    const pad   = 10;
    const lineH = 18;
    const boxW  = 210;
    const boxH  = pad * 2 + lines.length * lineH;

    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(pad, pad, boxW, boxH);

    ctx.font = '12px monospace';
    lines.forEach((line, i) => {
      ctx.fillStyle = i === 0 ? '#ffcc00' : line.startsWith('─') ? '#334455' : '#00ff88';
      ctx.fillText(line, pad + 8, pad + 14 + i * lineH);
    });

    // Controls hint (bottom-left)
    const hints = [
      '← →  : Ruder',
      '↑ ↓  : Segel-Trim',
      'R    : Reef',
      'T    : Neustart',
      'Esc  : Menü',
      '+/−/Rad: Zoom',
      'D    : Debug',
    ];
    const hintY = canvas.height - pad - hints.length * 18;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(pad, hintY - 6, 150, hints.length * 18 + 12);
    ctx.font = '12px monospace';
    hints.forEach((h, i) => {
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText(h, pad + 8, hintY + 8 + i * 18);
    });
  }
};
