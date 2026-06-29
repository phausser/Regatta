// Debug overlay – toggle with D key
const Debug = {
  enabled: false,

  update() {
    if (Input.isPressed('KeyD')) this.enabled = !this.enabled;
    document.getElementById('debug-panel').classList.toggle('hidden', !this.enabled);
  },

  draw(state) {
    if (!this.enabled) return;

    const hdgDeg  = (Boat.heading * 180 / Math.PI).toFixed(0).padStart(3);
    const awaDeg  = (Math.abs(Boat.awa) * 180 / Math.PI).toFixed(0);
    const awaDir  = Boat.awa >= 0 ? 'STBD' : 'PORT';
    const trimDeg = (Boat.trimAngle * 180 / Math.PI).toFixed(0);
    const stateStr = { good: 'OK ✓', luffing: 'LUFF ↑', overtrimmed: 'TIGHT ↓' }[Boat.sailState];
    const reefStr  = Boat.reefed ? 'REEF' : 'full';

    const lines = [
      'DEBUG  (D = toggle)',
      `FPS:   ${state.fps.toFixed(0)}`,
      `Cam:   ${Scene.x.toFixed(0)}, ${Scene.y.toFixed(0)}   z${Scene.zoom.toFixed(2)}`,
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

    document.getElementById('debug-panel').innerHTML =
      lines.map(l => `<div>${l}</div>`).join('') +
      '<div style="margin-top:8px;color:rgba(224,238,255,0.46)">' +
      '← →  Ruder · ↑ ↓  Trim · R Reef · T Neustart · H Test-Finish · Esc Menü · M Ton · +/−/Rad Zoom · D Debug' +
      '</div>';
  },
};
