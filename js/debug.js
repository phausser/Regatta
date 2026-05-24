// Debug overlay – toggle with D key
const Debug = {
  enabled: false,

  update() {
    if (Input.isPressed('KeyD')) this.enabled = !this.enabled;
  },

  draw(ctx, canvas, state) {
    if (!this.enabled) return;

    const SEA      = '#083478';
    const SEA_MID  = 'rgba(8,52,120,0.55)';
    const SEA_LINE = 'rgba(8,52,120,0.18)';

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

    const boxX = canvas.width - boxW - pad;
    const boxY = canvas.height - boxH - pad;

    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    ctx.font = '12px "Roboto Mono", monospace';
    lines.forEach((line, i) => {
      ctx.fillStyle = line.startsWith('─') ? SEA_LINE : i === 0 ? SEA : SEA_MID;
      ctx.fillText(line, boxX + 8, boxY + 14 + i * lineH);
    });

    // Steuerung (unten links)
    const hints = [
      '← →  : Ruder',
      '↑ ↓  : Segel-Trim',
      'R    : Reef',
      'T    : Neustart',
      'Esc  : Menü',
      'M    : Stummschalten',
      '+/−/Rad: Zoom',
      'D    : Debug',
    ];
    const hintY = canvas.height - pad - hints.length * 18;
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.fillRect(pad, hintY - 6, 160, hints.length * 18 + 12);
    ctx.font = '12px "Roboto Mono", monospace';
    hints.forEach((h, i) => {
      ctx.fillStyle = SEA_MID;
      ctx.fillText(h, pad + 8, hintY + 8 + i * 18);
    });
  }
};
