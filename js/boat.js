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

    // ── 1. Bootsvektor: Polar → Kartesisch ──────────────────────────────────
    // Konvention: heading=0 zeigt nach Norden (+Y = Süd im Canvas).
    // v = speed · (sin θ, −cos θ)  →  bei θ=0: vx=0, vy=−speed (nach oben = Nord ✓)
    this.vx =  this.speed * Math.sin(this.heading);
    this.vy = -this.speed * Math.cos(this.heading);

    // ── 2. Scheinbarer Wind (Apparent Wind) ──────────────────────────────────
    // AW = TW − v_Boot  (Vektorsubtraktion)
    // Physikalisch: Ein Beobachter auf dem Boot erfährt den Wind als Überlagerung
    // des echten Winds und des durch die eigene Fahrt erzeugten Gegenwinds.
    // Je schneller das Boot, desto mehr dreht der AW nach vorne (Vorwindverengung).
    this.awvx  = wind.vx - this.vx;
    this.awvy  = wind.vy - this.vy;
    this.awSpeed = Math.hypot(this.awvx, this.awvy);

    // ── 3. Bootseigenes Koordinatensystem + AWA ──────────────────────────────
    // Zwei orthogonale Einheitsvektoren spannen das lokale Bootsframe auf:
    //   bow  = Vorausrichtung      = (sin h,  −cos h)
    //   stbd = Steuerbordrichtung  = (cos h,   sin h)  [90° CW-Rotation von bow]
    //
    // AWA via Skalarprodukt (Projektion des AW-Vektors ins Bootsframe):
    //   awFwd   = −(AW · bow)   Minus, weil Wind von vorne → AW-Komponente zeigt achtern;
    //                            Vorzeichen dreht um, damit AWA=0 "von vorn" bedeutet.
    //   awRight =  (AW · stbd)  positiv = Wind von Steuerbord
    //   AWA = atan2(awRight, awFwd)  →  [−π, π], positiv = Steuerbord, negativ = Backbord
    const bowX  =  Math.sin(this.heading);
    const bowY  = -Math.cos(this.heading);
    const stbdX = -bowY;
    const stbdY =  bowX;

    const awFwd   = -(this.awvx * bowX  + this.awvy * bowY);
    const awRight =   this.awvx * stbdX + this.awvy * stbdY;
    this.awa = Math.atan2(awRight, awFwd);

    // ── 4. Polarkurve: AWA → Antriebseffizienz ───────────────────────────────
    // Echte Segelboote haben eine charakteristische Polarkurve: Am Wind (~45°) langsam,
    // Raumschots (~90–120°) am schnellsten, Vorwind (~180°) wieder etwas langsamer
    // (Segel wirkt nur als Widerstandsfläche, kein Auftrieb mehr).
    //
    // No-Go-Zone: |AWA| < 0.60 rad (≈34°) – zu spitz gegen den Wind, kein Auftrieb möglich.
    // Stückweise lineare Annäherung an die Polarkurve:
    //   0.60–0.90 rad  (34°– 52°): Aufkreuzen, steiler Anstieg
    //   0.90–1.90 rad  (52°–109°): Am Wind bis Raumschots, höchste Effizienz
    //   1.90–2.40 rad (109°–137°): Breiter Raumschots, Plateau ~0.95
    //   2.40– π   rad (137°–180°): Vorwind, leichter Abfall auf 0.60
    const awa_abs = Math.abs(this.awa);
    const NO_GO   = 0.60;

    let eff = 0;
    if (awa_abs >= NO_GO) {
      if      (awa_abs < 0.9) eff = (awa_abs - NO_GO) / 0.3 * 0.40;
      else if (awa_abs < 1.9) eff = 0.40 + (awa_abs - 0.9) * 0.55;
      else if (awa_abs < 2.4) eff = 0.95;
      else                    eff = 0.95 - (awa_abs - 2.4) / (Math.PI - 2.4) * 0.35;
    }

    // ── 5. Trimm-Effizienz ───────────────────────────────────────────────────
    // Für jeden AWA gibt es einen idealen Segelwinkel (idealTrim).
    // Abweichung davon (trimDiff) kostet Effizienz linear: trimEff ∈ [0, 1].
    // Zu weit gefiert (trimDiff > 0.22 rad): Segel lufft → kein Auftrieb.
    // Zu weit dichtgeholt (trimDiff < −0.22 rad): Segel übersteht → Strömungsabriss.
    const idealTrim = Math.min(TRIM_MAX, Math.max(TRIM_MIN, (awa_abs - NO_GO) * 0.60));
    const trimDiff  = this.trimAngle - idealTrim;   // >0: eased too much; <0: too tight
    const trimErr   = Math.abs(trimDiff);
    this.trimEff    = Math.max(0, 1 - trimErr * 1.4);

    if      (trimDiff >  0.22) this.sailState = 'luffing';
    else if (trimDiff < -0.22) this.sailState = 'overtrimmed';
    else                       this.sailState = 'good';

    // ── 6. Zielgeschwindigkeit + Trägheit ────────────────────────────────────
    // targetSpeed = polarkurve × trimEff × AWS × Skalierung × Reeffaktor
    // Kein F=ma: Statt Kraft → Beschleunigung → Geschwindigkeit wird die Geschwindigkeit
    // direkt auf einen Zielwert geglättet (Tiefpassfilter 1. Ordnung).
    // Asymmetrie der Rate: Beschleunigen (0.6) langsamer als Abbremsen (1.8) –
    // modelliert den höheren Strömungswiderstand bei Übergeschwindigkeit.
    const reefFactor = this.reefed ? 0.60 : 1.0;
    const targetSpeed = eff * this.trimEff * this.awSpeed * 1.05 * reefFactor;
    const rateToward  = targetSpeed > this.speed ? 0.6 : 1.8;
    this.speed += (targetSpeed - this.speed) * rateToward * dt;
    this.speed  = Math.max(0, this.speed);

    // ── 7. Positionsintegration + Abtrift (Leeway) ───────────────────────────
    // Leeway: Die Segel-Seitenkraft wird vom Kiel nicht vollständig absorbiert;
    // das Boot treibt leicht seitlich ab (~4 % der Antriebsgröße).
    // Abtriftrichtung = Steuerbordvektor (positiv bei Wind von Steuerbord).
    // Integration: Euler-Vorwärtsschritt  x += v · dt  (ausreichend bei dt ≤ 0.1 s).
    const leewaySpeed = eff * this.trimEff * this.awSpeed * 0.04 * (this.awa > 0 ? 1 : -1);
    this.x += (this.vx + stbdX * leewaySpeed) * dt;
    this.y += (this.vy + stbdY * leewaySpeed) * dt;
    this.x  = Math.max(0, Math.min(5000, this.x));
    this.y  = Math.max(0, Math.min(5000, this.y));
  },

};
