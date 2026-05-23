// Boat – physics, controls, rendering
const WORLD_SCALE = 20; // hull length in world units

const Boat = {
  x: 2500, y: 2500,
  heading:   0,     // radians, 0=north CW+
  speed:     0,     // world-units / second
  vx: 0, vy: 0,

  trimAngle: 0.5,   // sail angle from centerline (rad); 0=sheeted in, >0=eased

  // Apparent wind (computed each frame)
  awvx: 0, awvy: 0,
  awSpeed: 0,
  awa: 0,           // apparent wind angle in boat frame [-π,π]; 0=from ahead +π/2=stbd

  // ── Update ──────────────────────────────────────────────────────────────────
  update(dt, wind) {
    const TURN_RATE = 0.9;   // rad/s
    const TRIM_RATE = 0.6;   // rad/s
    const TRIM_MIN  = 0.05;
    const TRIM_MAX  = 1.48;  // ~85°

    // Controls
    if (Input.isDown('ArrowLeft'))  this.heading  -= TURN_RATE * dt;
    if (Input.isDown('ArrowRight')) this.heading  += TURN_RATE * dt;
    if (Input.isDown('ArrowUp'))    this.trimAngle = Math.max(TRIM_MIN, this.trimAngle - TRIM_RATE * dt);
    if (Input.isDown('ArrowDown'))  this.trimAngle = Math.min(TRIM_MAX, this.trimAngle + TRIM_RATE * dt);

    this.heading = ((this.heading % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

    // Boat velocity vector (heading 0=north → -y in canvas)
    this.vx =  this.speed * Math.sin(this.heading);
    this.vy = -this.speed * Math.cos(this.heading);

    // Apparent wind = true wind – boat velocity
    this.awvx  = wind.vx - this.vx;
    this.awvy  = wind.vy - this.vy;
    this.awSpeed = Math.hypot(this.awvx, this.awvy);

    // Decompose AW into boat frame
    // bow direction: (sin h, -cos h)  stbd direction: (cos h, sin h)
    const bowX  =  Math.sin(this.heading);
    const bowY  = -Math.cos(this.heading);
    const stbdX = -bowY;   // = cos h
    const stbdY =  bowX;   // = sin h

    // awFwd: negate dot so awa=0 means wind from dead AHEAD (standard convention)
    const awFwd   = -(this.awvx * bowX  + this.awvy * bowY);
    const awRight =   this.awvx * stbdX + this.awvy * stbdY;
    this.awa = Math.atan2(awRight, awFwd); // [-π,π]

    // Drive model
    const awa_abs = Math.abs(this.awa);
    const NO_GO   = 0.60; // ~34° – dead zone to windward

    let eff = 0;
    if (awa_abs >= NO_GO) {
      // Polar curve: peaks at broad reach (~120°), drops at close-hauled and running
      if      (awa_abs < 0.9)         eff = (awa_abs - NO_GO) / 0.3  * 0.40;
      else if (awa_abs < 1.9)         eff = 0.40 + (awa_abs - 0.9)   * 0.55;
      else if (awa_abs < 2.4)         eff = 0.95;
      else                            eff = 0.95 - (awa_abs - 2.4) / (Math.PI - 2.4) * 0.35;
    }

    // Sail trim efficiency
    const idealTrim = Math.min(TRIM_MAX, Math.max(TRIM_MIN, (awa_abs - NO_GO) * 0.60));
    const trimErr   = Math.abs(this.trimAngle - idealTrim);
    const trimEff   = Math.max(0, 1 - trimErr * 1.4);

    // Target speed (apparent-wind based); boat approaches it with inertia
    const targetSpeed = eff * trimEff * this.awSpeed * 1.05;
    const rateToward  = targetSpeed > this.speed ? 0.6 : 1.8;
    this.speed += (targetSpeed - this.speed) * rateToward * dt;
    this.speed  = Math.max(0, this.speed);

    // Leeway (small leeward drift proportional to side force)
    const leewaySpeed = eff * trimEff * this.awSpeed * 0.04 * (this.awa > 0 ? 1 : -1);

    this.x += (this.vx + stbdX * leewaySpeed) * dt;
    this.y += (this.vy + stbdY * leewaySpeed) * dt;
    this.x  = Math.max(0, Math.min(5000, this.x));
    this.y  = Math.max(0, Math.min(5000, this.y));
  },

  // ── Draw ────────────────────────────────────────────────────────────────────
  draw(ctx, canvas) {
    const s  = Camera.toScreen(this.x, this.y, canvas);
    const sc = Camera.zoom;

    const hl = WORLD_SCALE * sc * 0.50;  // half hull length px
    const hw = WORLD_SCALE * sc * 0.22;  // half hull width px

    ctx.save();
    ctx.translate(s.x, s.y);
    // ctx.rotate(heading): heading 0=north aligns bow with canvas-up without extra offset
    ctx.rotate(this.heading);

    // Hull
    ctx.beginPath();
    ctx.moveTo(0, -hl);           // bow
    ctx.lineTo(-hw, hl * 0.75);  // port stern
    ctx.lineTo( hw, hl * 0.75);  // stbd stern
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

    // Mast dot
    const mastY = -hl * 0.25;
    ctx.beginPath();
    ctx.arc(0, mastY, Math.max(1.5, sc * 0.8), 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Sail boom (hangs aft from mast toward leeward)
    const sailSide  = this.awa >= 0 ? -1 : 1;   // leeward side
    const sailAngle = sailSide * this.trimAngle;
    const sailLen   = hl * 1.6;
    const boomX     =  Math.sin(sailAngle) * sailLen;
    const boomY     =  Math.cos(sailAngle) * sailLen; // +Y = aft in local frame

    ctx.beginPath();
    ctx.moveTo(0, mastY);
    ctx.lineTo(boomX, mastY + boomY);
    ctx.strokeStyle = '#fff9c4';
    ctx.lineWidth   = Math.max(1.5, sc * 0.8);
    ctx.stroke();

    ctx.restore();

    // Wind arrows (screen-space, attached to boat screen pos)
    this._drawWindArrows(ctx, s, sc);
  },

  _drawWindArrows(ctx, s, sc) {
    const arrowLen = WORLD_SCALE * sc * 1.2;

    // True wind arrow (cyan)
    this._drawArrow(ctx, s, Wind.vx, Wind.vy, arrowLen, '#00e5ff');

    // Apparent wind arrow (orange)
    this._drawArrow(ctx, s, this.awvx, this.awvy, arrowLen, '#ff9800');
  },

  _drawArrow(ctx, origin, vx, vy, len, color) {
    const mag = Math.hypot(vx, vy);
    if (mag < 0.01) return;
    const nx = vx / mag;
    const ny = vy / mag;
    const ex = origin.x + nx * len;
    const ey = origin.y + ny * len;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = 2;
    ctx.globalAlpha = 0.8;

    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    // Arrowhead
    const headLen = len * 0.18;
    const angle   = Math.atan2(vy, vx);
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - headLen * Math.cos(angle - 0.4), ey - headLen * Math.sin(angle - 0.4));
    ctx.lineTo(ex - headLen * Math.cos(angle + 0.4), ey - headLen * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
};
