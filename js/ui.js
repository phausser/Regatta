// UI – Startmenü, Rennende-Overlay, Highscores
const UI = {
  _menuSel:   0,
  _newRank:   -1,
  _waveT:     0,

  // Farbpalette
  _SEA:       '#083478',               // Meeresblau (Hauptfarbe)
  _SEA_MID:   'rgba(8,52,120,0.55)',
  _SEA_FAINT: 'rgba(8,52,120,0.35)',
  _BTN:       'rgba(8,52,120,0.07)',   // Button Standard
  _BTN_HOV:   'rgba(8,52,120,0.15)',   // Button Hover
  _GOLD:      '#7a5800',               // Bestzeit-Akzent (lesbar auf Weiß)

  // ── Highscores (localStorage) ──────────────────────────────────────────────
  _KEY: 'geosail-scores',

  scores() {
    try { return JSON.parse(localStorage.getItem(this._KEY)) || []; }
    catch { return []; }
  },

  saveScore(timeSeconds) {
    const list = this.scores();
    list.push(timeSeconds);
    list.sort((a, b) => a - b);
    const top5 = list.slice(0, 5);
    this._newRank = top5.indexOf(timeSeconds);
    try { localStorage.setItem(this._KEY, JSON.stringify(top5)); } catch {}
    return this._newRank;
  },

  // ── Menu ───────────────────────────────────────────────────────────────────
  updateMenu(dt) {
    this._waveT += dt;
    if (Input.isPressed('ArrowUp'))   this._menuSel = Math.max(0, this._menuSel - 1);
    if (Input.isPressed('ArrowDown')) this._menuSel = Math.min(1, this._menuSel + 1);
    if (Input.isPressed('Enter') || Input.isPressed('Space')) {
      return this._menuSel === 0 ? 'game' : 'tutorial';
    }
    return null;
  },

  drawMenu(ctx, canvas) {
    const W = canvas.width, H = canvas.height;

    // Meereshintergrund (passend zu renderer.js)
    const wf = Math.min(1, Wind.speed / 18);
    const r  = Math.round(8  + wf * 5);
    const g  = Math.round(52 + wf * 14);
    const b  = Math.round(120 + wf * 20);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, W, H);

    // Wellenlinien
    const wx = Math.sin(Wind.dir), wy = -Math.cos(Wind.dir);
    const px = -wy, py = wx;
    const spacing = 60;
    const cx = W / 2, cy = H / 2;
    const diag = Math.hypot(W, H);
    const phase = (this._waveT * 18) % spacing;
    ctx.save();
    ctx.strokeStyle = 'rgba(140,200,255,0.16)';
    ctx.lineWidth = 1.2;
    for (let d = -diag + phase; d < diag + spacing; d += spacing) {
      ctx.beginPath();
      let first = true;
      for (let s = -diag; s <= diag; s += 12) {
        const wave = 4 * Math.sin(s * 0.018 + this._waveT * 1.6 + d * 0.01);
        const sx = cx + px * s + wx * (d + wave);
        const sy = cy + py * s + wy * (d + wave);
        if (first) { ctx.moveTo(sx, sy); first = false; }
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
    ctx.restore();

    // Weißes Panel
    const panW = 360, panH = 290;
    const panX = W / 2 - panW / 2, panY = H / 2 - panH / 2 - 20;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    this._roundRect(ctx, panX, panY, panW, panH, 14);
    ctx.fill();
    ctx.restore();

    // Titel
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = 'bold 36px Roboto, sans-serif';
    ctx.fillStyle    = this._SEA;
    ctx.fillText('GeoSail', W / 2, panY + 52);
    ctx.font      = '13px "Roboto Mono", monospace';
    ctx.fillStyle = this._SEA_MID;
    ctx.fillText('Regatta', W / 2, panY + 80);
    ctx.restore();

    // Buttons
    const labels = ['Rennen starten', 'Tutorial'];
    const btnW   = 200, btnH = 42, btnX = W / 2 - btnW / 2;
    const btnY0  = panY + 112;
    const mouse  = Input.mousePos();

    for (let i = 0; i < labels.length; i++) {
      const by    = btnY0 + i * 56;
      const hover = mouse.x >= btnX && mouse.x <= btnX + btnW &&
                    mouse.y >= by   && mouse.y <= by + btnH;
      if (hover) this._menuSel = i;

      const active = this._menuSel === i;
      ctx.save();
      ctx.fillStyle = active ? this._BTN_HOV : this._BTN;
      this._roundRect(ctx, btnX, by, btnW, btnH, 8);
      ctx.fill();

      ctx.font         = active ? 'bold 15px Roboto, sans-serif' : '15px Roboto, sans-serif';
      ctx.fillStyle    = this._SEA;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], W / 2, by + btnH / 2);
      ctx.restore();

      if (hover && Input.isClick()) return i === 0 ? 'game' : 'tutorial';
    }

    // Bestzeiten
    const sc = this.scores();
    if (sc.length > 0) {
      ctx.save();
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';
      ctx.font         = '11px "Roboto Mono", monospace';
      ctx.fillStyle    = this._SEA_FAINT;
      ctx.fillText('Bestzeiten', W / 2, panY + panH - 72);
      for (let i = 0; i < sc.length; i++) {
        ctx.fillStyle = i === 0 ? this._SEA : this._SEA_MID;
        ctx.font      = i === 0 ? 'bold 11px "Roboto Mono", monospace' : '11px "Roboto Mono", monospace';
        ctx.fillText(`${i + 1}. ${this._fmtTime(sc[i])}`, W / 2, panY + panH - 57 + i * 14);
      }
      ctx.restore();
    }

    // Hinweis unten
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font         = '10px "Roboto Mono", monospace';
    ctx.fillStyle    = 'rgba(255,255,255,0.30)';
    ctx.fillText('↑↓ navigieren  ·  Enter bestätigen', W / 2, H - 14);
    ctx.restore();

    return null;
  },

  // ── Finish overlay ─────────────────────────────────────────────────────────
  drawFinishOverlay(ctx, canvas) {
    const W = canvas.width, H = canvas.height;
    const panW = 360, panH = 300;
    const panX = W / 2 - panW / 2, panY = H / 2 - panH / 2;

    ctx.save();

    // Weißes Panel
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    this._roundRect(ctx, panX, panY, panW, panH, 14);
    ctx.fill();

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    ctx.font      = 'bold 26px Roboto, sans-serif';
    ctx.fillStyle = this._SEA;
    ctx.fillText('Ziel erreicht!', W / 2, panY + 44);

    ctx.font      = '22px "Roboto Mono", monospace';
    ctx.fillStyle = this._SEA;
    ctx.fillText(Race._fmtTime(Race.raceTime), W / 2, panY + 84);

    const rank = this._newRank;
    if (rank === 0) {
      ctx.font      = '13px Roboto, sans-serif';
      ctx.fillStyle = this._GOLD;
      ctx.fillText('Neue Bestzeit!', W / 2, panY + 114);
    } else if (rank > 0) {
      ctx.font      = '13px Roboto, sans-serif';
      ctx.fillStyle = this._SEA_MID;
      ctx.fillText(`Platz ${rank + 1} in den Bestzeiten`, W / 2, panY + 114);
    }

    // Bestzeiten-Liste
    const sc = this.scores();
    ctx.font      = '11px "Roboto Mono", monospace';
    ctx.fillStyle = this._SEA_FAINT;
    ctx.fillText('Bestzeiten', W / 2, panY + 146);
    for (let i = 0; i < sc.length; i++) {
      const hi = i === rank;
      ctx.font      = hi ? 'bold 12px "Roboto Mono", monospace' : '11px "Roboto Mono", monospace';
      ctx.fillStyle = hi ? this._SEA : this._SEA_MID;
      ctx.fillText(`${i + 1}. ${this._fmtTime(sc[i])}`, W / 2, panY + 164 + i * 18);
    }

    // Buttons
    const labels  = ['Nochmal', 'Hauptmenü'];
    const btnW    = 130, btnH = 38;
    const btnsY   = panY + panH - 52;
    const gap     = 16;
    const startBX = W / 2 - btnW - gap / 2;
    const mouse   = Input.mousePos();
    let   clicked = null;

    for (let i = 0; i < 2; i++) {
      const bx    = startBX + i * (btnW + gap);
      const hover = mouse.x >= bx && mouse.x <= bx + btnW &&
                    mouse.y >= btnsY && mouse.y <= btnsY + btnH;
      ctx.fillStyle = hover ? this._BTN_HOV : this._BTN;
      this._roundRect(ctx, bx, btnsY, btnW, btnH, 8);
      ctx.fill();
      ctx.font      = hover ? 'bold 14px Roboto, sans-serif' : '14px Roboto, sans-serif';
      ctx.fillStyle = this._SEA;
      ctx.fillText(labels[i], bx + btnW / 2, btnsY + btnH / 2);
      if (hover && Input.isClick()) clicked = i === 0 ? 'restart' : 'menu';
    }

    ctx.restore();
    return clicked;
  },

  // ── Helpers ────────────────────────────────────────────────────────────────
  _fmtTime(s) {
    const m  = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    const t  = Math.floor((s % 1) * 10);
    return `${m}:${ss.toString().padStart(2,'0')}.${t}`;
  },

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },
};
