// Boat – physics, controls, rendering
const WORLD_SCALE = 20; // hull length in world units

const Boat = {
  x: 2500, y: 2800,
  heading:   0,
  speed:     0,
  vx: 0, vy: 0,

  trimAngle: 0.5,   // sail angle from centerline (rad); 0=sheeted in, >0=eased
  reefed:    false,

  // Apparent wind (computed each frame)
  awvx: 0, awvy: 0,
  awSpeed: 0,
  awa: 0,

  // Derived sail state (kept for draw + debug)
  trimEff:   0,
  sailState: 'good', // 'good' | 'luffing' | 'overtrimmed'

  // ── Update ──────────────────────────────────────────────────────────────────
  update(dt, wind) {
    const TURN_RATE = 0.9;
    const TRIM_RATE = 0.6;
    const TRIM_MIN  = 0.05;
    const TRIM_MAX  = 1.48;

    // Controls
    if (Input.isDown('ArrowLeft'))  this.heading   -= TURN_RATE * dt;
    if (Input.isDown('ArrowRight')) this.heading   += TURN_RATE * dt;
    if (Input.isDown('ArrowUp'))    this.trimAngle  = Math.max(TRIM_MIN, this.trimAngle - TRIM_RATE * dt);
    if (Input.isDown('ArrowDown'))  this.trimAngle  = Math.min(TRIM_MAX, this.trimAngle + TRIM_RATE * dt);
    if (Input.isPressed('KeyR'))    this.reefed     = !this.reefed;

    this.heading = ((this.heading % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

    // Boat velocity
    this.vx =  this.speed * Math.sin(this.heading);
    this.vy = -this.speed * Math.cos(this.heading);

    // Apparent wind
    this.awvx  = wind.vx - this.vx;
    this.awvy  = wind.vy - this.vy;
    this.awSpeed = Math.hypot(this.awvx, this.awvy);

    // Boat frame axes
    const bowX  =  Math.sin(this.heading);
    const bowY  = -Math.cos(this.heading);
    const stbdX = -bowY;
    const stbdY =  bowX;

    const awFwd   = -(this.awvx * bowX  + this.awvy * bowY);
    const awRight =   this.awvx * stbdX + this.awvy * stbdY;
    this.awa = Math.atan2(awRight, awFwd);

    // Polar curve
    const awa_abs = Math.abs(this.awa);
    const NO_GO   = 0.60;

    let eff = 0;
    if (awa_abs >= NO_GO) {
      if      (awa_abs < 0.9) eff = (awa_abs - NO_GO) / 0.3 * 0.40;
      else if (awa_abs < 1.9) eff = 0.40 + (awa_abs - 0.9) * 0.55;
      else if (awa_abs < 2.4) eff = 0.95;
      else                    eff = 0.95 - (awa_abs - 2.4) / (Math.PI - 2.4) * 0.35;
    }

    // Trim efficiency + sail state
    const idealTrim = Math.min(TRIM_MAX, Math.max(TRIM_MIN, (awa_abs - NO_GO) * 0.60));
    const trimDiff  = this.trimAngle - idealTrim;   // >0: eased too much; <0: too tight
    const trimErr   = Math.abs(trimDiff);
    this.trimEff    = Math.max(0, 1 - trimErr * 1.4);

    if      (trimDiff >  0.22) this.sailState = 'luffing';
    else if (trimDiff < -0.22) this.sailState = 'overtrimmed';
    else                       this.sailState = 'good';

    const reefFactor = this.reefed ? 0.60 : 1.0;
    const targetSpeed = eff * this.trimEff * this.awSpeed * 1.05 * reefFactor;
    const rateToward  = targetSpeed > this.speed ? 0.6 : 1.8;
    this.speed += (targetSpeed - this.speed) * rateToward * dt;
    this.speed  = Math.max(0, this.speed);

    const leewaySpeed = eff * this.trimEff * this.awSpeed * 0.04 * (this.awa > 0 ? 1 : -1);
    this.x += (this.vx + stbdX * leewaySpeed) * dt;
    this.y += (this.vy + stbdY * leewaySpeed) * dt;
    this.x  = Math.max(0, Math.min(5000, this.x));
    this.y  = Math.max(0, Math.min(5000, this.y));
  },

  // ── Draw ────────────────────────────────────────────────────────────────────
  draw(ctx, canvas) {
    const s  = Camera.toScreen(this.x, this.y, canvas);
    const sc = Camera.zoom;

    const hl = WORLD_SCALE * sc * 0.50;
    const hw = WORLD_SCALE * sc * 0.22;

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(this.heading);

    // Hull
    ctx.beginPath();
    ctx.moveTo(0, -hl);
    ctx.lineTo(-hw, hl * 0.75);
    ctx.lineTo( hw, hl * 0.75);
    ctx.closePath();
    ctx.fillStyle   = '#dde8f0';
    ctx.fill();
    ctx.strokeStyle = '#88aacc';
    ctx.lineWidth   = 1;
    ctx.stroke();

    // Keel
    ctx.fillStyle = '#445566';
    ctx.fillRect(-hw * 0.2, -hl * 0.1, hw * 0.4, hl * 0.6);

    // Rudder
    ctx.fillStyle = '#445566';
    ctx.fillRect(-hw * 0.18, hl * 0.55, hw * 0.36, hl * 0.3);

    // Mast
    const mastY = -hl * 0.25;
    ctx.beginPath();
    ctx.arc(0, mastY, Math.max(2, sc), 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // ── Sail ─────────────────────────────────────────────────────────────────
    const sailSide   = this.awa >= 0 ? -1 : 1;  // leeward: -1=port, +1=stbd
    const sailAngle  = sailSide * this.trimAngle;
    const reefFactor = this.reefed ? 0.62 : 1.0;
    const sailLen    = hl * 1.6 * reefFactor;
    const boomX      = Math.sin(sailAngle) * sailLen;
    const boomY      = Math.cos(sailAngle) * sailLen; // aft = +Y in local frame

    // Bezier control point for sail belly (leeward of chord midpoint)
    const midX    = boomX * 0.5;
    const midY    = mastY + boomY * 0.5;
    const bellyD  = sailLen * 0.30 * Math.max(0.05, this.trimEff);

    // Luffing: belly oscillates (sail flapping)
    const now     = performance.now() * 0.001;
    const luffAmt = this.sailState === 'luffing' ? Math.max(0, Math.sin(now * 5.5)) * 0.8 : 1.0;
    const ctrlX   = midX + sailSide * bellyD * luffAmt;
    const ctrlY   = midY;

    // Sail color encodes trim state
    let sailFill;
    switch (this.sailState) {
      case 'good':        sailFill = 'rgba(255, 252, 185, 0.82)'; break;
      case 'luffing':     sailFill = 'rgba(255, 110,  70, 0.70)'; break;
      case 'overtrimmed': sailFill = 'rgba(255, 210,  80, 0.75)'; break;
    }

    // Filled sail: leech (curved) + luff (straight, via closePath)
    ctx.beginPath();
    ctx.moveTo(0, mastY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, boomX, mastY + boomY); // leech with belly
    ctx.closePath();                                            // luff (straight back)
    ctx.fillStyle = sailFill;
    ctx.fill();

    // Boom line
    ctx.beginPath();
    ctx.moveTo(0, mastY);
    ctx.lineTo(boomX, mastY + boomY);
    ctx.strokeStyle = 'rgba(210, 200, 120, 0.90)';
    ctx.lineWidth   = Math.max(1.5, sc * 0.7);
    ctx.stroke();

    // Reef band: orange dashes across sail at 60% of boom length
    if (this.reefed) {
      const rx = boomX * 0.5, ry = mastY + boomY * 0.5;
      const rs = hw * 0.5;
      ctx.strokeStyle = '#ff6633';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(rx - rs, ry - rs * 0.3);
      ctx.lineTo(rx + rs, ry + rs * 0.3);
      ctx.stroke();
    }

    ctx.restore();

    this._drawWindArrows(ctx, s, sc);
  },

  _drawWindArrows(ctx, s, sc) {
    const len = WORLD_SCALE * sc * 1.2;
    this._drawArrow(ctx, s, Wind.vx,     Wind.vy,     len, '#00e5ff'); // true wind (cyan)
    this._drawArrow(ctx, s, this.awvx,   this.awvy,   len, '#ff9800'); // apparent wind (orange)
  },

  _drawArrow(ctx, origin, vx, vy, len, color) {
    const mag = Math.hypot(vx, vy);
    if (mag < 0.01) return;
    const nx = vx / mag, ny = vy / mag;
    const ex = origin.x + nx * len, ey = origin.y + ny * len;
    const hl = len * 0.18;
    const a  = Math.atan2(vy, vx);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = 2;
    ctx.globalAlpha = 0.80;

    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - hl * Math.cos(a - 0.4), ey - hl * Math.sin(a - 0.4));
    ctx.lineTo(ex - hl * Math.cos(a + 0.4), ey - hl * Math.sin(a + 0.4));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
};
