// UI – Startmenü, Rennende-Overlay, Highscores
const UI = {
  _menuSel:   0,   // 0=Rennen, 1=Tutorial
  _newRank:   -1,  // index of newly saved score (-1=none)
  _waveT:     0,

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
    return null;  // mouse clicks handled in drawMenu
  },

  drawMenu(ctx, canvas) {
    const W = canvas.width, H = canvas.height;

    // Animated water background (reuse renderer tiles palette without Renderer dependency)
    const wf = Math.min(1, Wind.speed / 18);
    const r  = Math.round(8  + wf * 6);
    const g  = Math.round(20 + wf * 12);
    const b  = Math.round(42 + wf * 18);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, W, H);

    // Simple animated wave lines across full screen
    const wx = Math.sin(Wind.dir), wy = -Math.cos(Wind.dir);
    const px = -wy, py =  wx;
    const spacing = 60;
    const cx = W / 2, cy = H / 2;
    const diag = Math.hypot(W, H);
    const phase = (this._waveT * 18 * 1) % spacing;

    ctx.save();
    ctx.strokeStyle = 'rgba(120,180,230,0.07)';
    ctx.lineWidth = 1;
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

    // Dark panel
    const panW = 360, panH = 280;
    const panX = W / 2 - panW / 2, panY = H / 2 - panH / 2 - 20;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.60)';
    this._roundRect(ctx, panX, panY, panW, panH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, panX, panY, panW, panH, 12);
    ctx.stroke();
    ctx.restore();

    // Title
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = 'bold 36px sans-serif';
    ctx.fillStyle    = '#00e5ff';
    ctx.fillText('GeoSail', W / 2, panY + 52);
    ctx.font      = '14px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.50)';
    ctx.fillText('Regatta', W / 2, panY + 82);
    ctx.restore();

    // Buttons
    const labels   = ['Rennen starten', 'Tutorial'];
    const btnW     = 200, btnH = 42, btnX = W / 2 - btnW / 2;
    const btnY0    = panY + 120;
    const mouse    = Input.mousePos();

    for (let i = 0; i < labels.length; i++) {
      const by    = btnY0 + i * 58;
      const hover = mouse.x >= btnX && mouse.x <= btnX + btnW &&
                    mouse.y >= by   && mouse.y <= by + btnH;
      if (hover) this._menuSel = i;

      const sel = this._menuSel === i;
      ctx.save();
      ctx.fillStyle = sel ? 'rgba(0,229,255,0.22)' : 'rgba(255,255,255,0.07)';
      this._roundRect(ctx, btnX, by, btnW, btnH, 8);
      ctx.fill();
      ctx.strokeStyle = sel ? '#00e5ff' : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = sel ? 1.5 : 1;
      this._roundRect(ctx, btnX, by, btnW, btnH, 8);
      ctx.stroke();

      ctx.font         = sel ? 'bold 15px sans-serif' : '15px sans-serif';
      ctx.fillStyle    = sel ? '#ffffff' : 'rgba(255,255,255,0.65)';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], W / 2, by + btnH / 2);
      ctx.restore();

      if (hover && Input.isClick()) {
        return i === 0 ? 'game' : 'tutorial';
      }
    }

    // Highscores
    const sc = this.scores();
    if (sc.length > 0) {
      ctx.save();
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';
      ctx.font         = '11px monospace';
      ctx.fillStyle    = 'rgba(255,255,255,0.30)';
      ctx.fillText('Bestzeiten', W / 2, panY + panH - 66);
      for (let i = 0; i < sc.length; i++) {
        ctx.fillStyle = i === 0 ? 'rgba(0,229,255,0.70)' : 'rgba(255,255,255,0.35)';
        ctx.fillText(`${i + 1}. ${this._fmtTime(sc[i])}`, W / 2, panY + panH - 52 + i * 14);
      }
      ctx.restore();
    }

    // Controls hint
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font         = '10px monospace';
    ctx.fillStyle    = 'rgba(255,255,255,0.22)';
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
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    this._roundRect(ctx, panX, panY, panW, panH, 14);
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, panX, panY, panW, panH, 14);
    ctx.stroke();

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    ctx.font      = 'bold 28px sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('Ziel erreicht!', W / 2, panY + 44);

    // Race time
    ctx.font      = '22px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(Race._fmtTime(Race.raceTime), W / 2, panY + 86);

    // Rank announcement
    const rank = this._newRank;
    if (rank === 0) {
      ctx.font      = '13px sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.fillText('Neue Bestzeit!', W / 2, panY + 116);
    } else if (rank > 0) {
      ctx.font      = '13px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.60)';
      ctx.fillText(`Platz ${rank + 1} in den Bestzeiten`, W / 2, panY + 116);
    }

    // Highscore list
    const sc   = this.scores();
    ctx.font      = '11px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.fillText('Bestzeiten', W / 2, panY + 148);
    for (let i = 0; i < sc.length; i++) {
      const highlight = i === rank;
      ctx.font      = highlight ? 'bold 12px monospace' : '11px monospace';
      ctx.fillStyle = highlight ? '#00e5ff' : 'rgba(255,255,255,0.45)';
      ctx.fillText(`${i + 1}. ${this._fmtTime(sc[i])}`, W / 2, panY + 166 + i * 18);
    }

    // Buttons: Nochmal / Menü
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
      ctx.fillStyle = hover ? 'rgba(0,229,255,0.22)' : 'rgba(255,255,255,0.07)';
      this._roundRect(ctx, bx, btnsY, btnW, btnH, 8);
      ctx.fill();
      ctx.strokeStyle = hover ? '#00e5ff' : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = hover ? 1.5 : 1;
      this._roundRect(ctx, bx, btnsY, btnW, btnH, 8);
      ctx.stroke();
      ctx.font      = '14px sans-serif';
      ctx.fillStyle = hover ? '#ffffff' : 'rgba(255,255,255,0.65)';
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
