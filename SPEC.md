# GeoSail Regatta – Projekt-Spezifikation

## Allgemeines
- **Projektname**: GeoSail Regatta
- **Typ**: Minimalistisches 2D Segel-Regatta Spiel (Top-Down)
- **Technik**: HTML5 Canvas, Vanilla JavaScript, Web Audio API
- **Ansicht**: Senkrecht von oben, Kamera folgt dem Boot, keine Rotation
- **Ziel**: Spaßiges, arcade-taugliches Segelspiel mit realistischer Windphysik

## Visuelles Konzept

### Stil
- **Clean und minimalistisch** – keine unnötigen Details, kein Lärm
- Wenige, gut gewählte Farben: blaues Wasser mit leichtem Sonnenverlauf, weißer Rumpf, kräftige Akzentfarben für Bojen
- Tiefe durch projizierte Schatten – Boot, Bojen und Gate werfen formbasierte Schatten auf das Wasser
- Kamera immer senkrecht von oben (kein Tilt)

### Farbpalette
| Element | Farbe |
|---------|-------|
| Wasser Verlauf hell | `#6398c7` |
| Wasser Verlauf dunkel | `#356891` |
| Wellen | `#e6f7ff` mit Alpha |
| Rumpf | `#ffffff` |
| Mast | `#ffffff` |
| Segel | `#44ff88` |
| Boje Backbord (rot) | `#ff3344` |
| Boje Steuerbord (grün) | `#33ee66` |
| Kurstonnen | `#ffcc00` |
| Kursindikator Bojen | `#ffcc00` aktiv, 25 % Alpha inaktiv |
| Kursindikator Gate | `#ffffff` aktiv, 25 % Alpha inaktiv |
| HUD Text | `#e0eeff` auf dunklem Hintergrund |

## Kern-Features

### 1. Spielwelt
- Welt: 5000 × 5000 Einheiten (1 WE ≈ 1 Meter)
- Canvas-Welt mit Follow-Kamera und Zoom
- Kamera folgt dem Boot, immer senkrecht von oben

### 2. Wasser
- Große Canvas-Wasserfläche mit linearem Farbverlauf von Sonnenrichtung in Schattenrichtung
- Animierte Dreiecks-Wellen bewegen sich in Richtung des wahren Windes
- Dezentes Welt-Grid und Kurslinien bleiben funktional sichtbar

### 3. Boot & Segel
- Rumpf: weiße, gefüllte Canvas-Außenform ohne Deckdetails
- Mast: weißer Punkt, funktional sichtbar
- Segel: gewölbtes grünes Polygon, jedes Frame aus Trimm/AWA berechnet
- Bugwellen: subtile weiße Pixel am Bug; Anzahl steigt mit Geschwindigkeit, langsames Ausblenden
- Schatten: aus Sonnenposition, Sonnenhöhe und Objektkontur projiziert

### 4. Physik
- **Scheinbarer Wind (Apparent Wind)** – echte Vektorberechnung
- Polarkurve: AWA → Antriebseffizienz
- Trimm-Modell mit Luffing / Overtrimmed Feedback
- Trägheit, Leeway (seitliche Drift), No-Go-Zone (|AWA| < ~34°)
- **Arcade-Tuning**: Wendeträgigkeit reduziert, Boot spürbar flotter als reales Boot

### 5. Kurs & Timing
- **Ziel-Rundenzeit: 5–8 Minuten**
- Kompakter Kurs (Marken ~600–900 WE Abstand)
- Gate: Port (2200, 2600) / Stbd (2800, 2600)
- Mark 1: (2000, 2100) – Luv-Tonne
- Mark 2: (3000, 2100) – Raumschots-Tonne
- Mark 3: (2500, 3000) – Lee-Tonne
- Startposition Boot: (2500, 2800)

### 6. Wind-System
- True Wind: Standard 14 kn aus Ost
- Langsame Drift (±15° alle 15–40 s)
- Apparent Wind: TW − v_Boot

### 7. Bojen & Gate
- Kurstonnen: gelbe Canvas-Kreise mit Bob-Animation; Farbe ändert sich nicht bei Aktivität
- Gate-Pfosten: rote/grüne Marker
- Alle Marken werfen formbasierte projizierte Schatten
- Kursindikatoren liegen als Dreiecke in ca. 100 px Abstand um das Boot: Bojen gelb, Gate weiß, inaktiv 25 % Alpha

### 8. Schatten & Lichtwirkung
- Keine Licht-/Shadow-Map-Abhängigkeit
- Sonnenposition lebt in `Scene.sun`
- Schattenlänge = Objekthöhe × horizontale Sonnendistanz / Sonnenhöhe
- Schattenfläche entsteht aus der konvexen Außenhülle von Objektkontur + projizierter Kontur
- Schatten startet am Objekt dunkler und läuft in Schattenrichtung auf Alpha 0 aus

### 9. HUD
- **HTML-Overlay** (kein Canvas-Zeichnen)
- Oben rechts: Phase, Zeit, Geschwindigkeit, nächste Tonne + Distanz
- Wind-Kompass: Canvas-Element oben links, 50 % Alpha, größerer Kreis
- Wahrer Wind: blauer Dreieckspfeil, zeigt woher der Wind kommt
- Scheinbarer Wind: roter Dreieckspfeil, zeigt woher der scheinbare Wind kommt
- Klares, minimalistisches Design: dunkler semi-transparenter Hintergrund, heller Text

### 10. Menü, Sound & Highscores
- Startmenü, Tutorial, Finish-Overlay: HTML-Overlays (wie bisher)
- Sound: unverändert (Web Audio API)
- Highscores: Server-basiert, Top 5 im Startmenü und Finish-Overlay
- Client startet eine Score-Session beim echten Rennstart (`pre_start` → `racing`)
- Client reicht die Zielzeit mit Session-ID und SHA-256-Hash ein
- Kein lokaler `localStorage`-Fallback für Bestzeiten

### 10.1 Highscore-Server
- Flask-Server in `server/app.py`, SQLite-Datenbank neben `app.py`
- `GET /health` für Healthcheck
- `POST /start-session` erzeugt Session-ID und Secret
- `POST /submit-score` validiert Session, Browser-Signatur, Hash und Zeit
- `GET /leaderboard?limit=...` liefert die schnellsten Zeiten
- Browser-Signatur basiert nur auf normalen Request-Headern
- Zeit-Plausibilität: `180 < time < 3600`
- Eingereichte Zeit darf nicht kürzer als die Session-Laufzeit sein
- CORS ist für lokale Entwicklungs-Origins freigeschaltet

### 11. Steuerung
| Taste | Aktion |
|-------|--------|
| `←` / `→` | Ruder |
| `↑` | Segel fieren |
| `↓` | Segel einholen |
| `R` | Reef |
| `T` | Neustart |
| `Esc` | Hauptmenü |
| `M` | Ton |
| `+` / `−` / Rad | Zoom |
| `D` | Debug |

## Technische Anforderungen
- Kein npm, kein Build-Step, keine externen Rendering-Abhängigkeiten
- Delta-Time Game-Loop (dt gekappt auf 0,1 s), integriert in `requestAnimationFrame`
- Saubere Modul-Trennung: Physik ≠ Rendering
- Responsive (window resize → camera + renderer update)
- AudioContext lazy initialisiert
- Kein Framework, reines Vanilla JS

## Status

| Phase | Inhalt | Status |
|-------|--------|--------|
| 0 | Canvas, Game Loop, Kamera, Debug | ✓ |
| 1 | Boot-Physik, Apparent Wind, Kraft | ✓ |
| 2 | Wind-Visualisierung, Trim-Modell, Reefing | ✓ |
| 3 | Rennstrecke, Bojen, Start/Ziel, Zeitmessung | ✓ |
| 4 | Wasser-Rendering, HUD, Bugwellen | ✓ |
| 5 | Menü, Tutorial, Highscores, Sound | ✓ |
| 6 | Canvas-Renderer, HTML-HUD, Follow-Kamera | ✓ |
| 7 | Canvas-Wasser, Wasserverlauf, Dreiecks-Wellen | ✓ |
| 8 | Bootssilhouette, Segel, Bugpixel, projizierter Schatten | ✓ |
| 9 | Bojen, Gate, Kurslinien, Kursindikatoren | ✓ |
| 10 | Arcade-Tuning: Kurs kompakt, Boot schneller, Wind 14 kn | ✓ |
| 11 | Visueller Polish: Kompass, Schatten, Wasser, HUD | ✓ |
| 12 | Three.js-Rueckbau abgeschlossen | ✓ |
| 13 | Server-Highscores: Flask, SQLite, Client-Anbindung, kein localStorage | ✓ |

---

**Letztes Update**: 29. Juni 2026 - Server-Highscores mit Flask/SQLite und Client-Anbindung
**Autor**: Patrick + Claude
