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
- Wenige, gut gewählte Farben: Tiefblau Wasser, Weiß/Creme Segel, kräftige Akzentfarben für Bojen
- Tiefe durch kontrollierte Contact-Shadows – Boot, Bojen und Gate werfen weiche Schatten auf das Wasser
- Kamera immer senkrecht von oben (kein Tilt)

### Farbpalette
| Element | Farbe |
|---------|-------|
| Wasser (tief) | `#0a1f3c` |
| Wasser (Kamm) | `#1a4a7a` |
| Schaum / Wellen | `rgba(255,255,255,0.15–0.5)` |
| Rumpf | `#e8f0f5` (hell, leicht grau) |
| Mast | `#ffffff` |
| Segel (gut getrimmt) | `#fffce0` (cremeweiß) |
| Segel (luffing) | `#ff6040` |
| Segel (overtrimmed) | `#ffd050` |
| Boje Backbord (rot) | `#ff3344` |
| Boje Steuerbord (grün) | `#33ee66` |
| Kurstonnen | `#ffcc00` |
| HUD Text | `#e0eeff` auf dunklem Hintergrund |

## Kern-Features

### 1. Spielwelt
- Welt: 5000 × 5000 Einheiten (1 WE ≈ 1 Meter)
- Canvas-Welt mit Follow-Kamera und Zoom
- Kamera folgt dem Boot, immer senkrecht von oben

### 2. Wasser
- Große Canvas-Wasserfläche mit animierten Dreiecks-Wellen
- Tiefblau-Basis, helle windabhängige Wellenkämme
- Dezentes Welt-Grid und Kurslinien bleiben funktional sichtbar

### 3. Boot & Segel
- Rumpf: weiße, gefüllte Canvas-Außenform ohne Deckdetails
- Mast: weißer Punkt, funktional sichtbar
- Segel: gewölbtes Polygon, jedes Frame aus Trimm/AWA berechnet
- Bugwellen: leichte Canvas-Partikel
- Schatten: gezeichneter Contact-Shadow unter dem Boot

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
- Bojen: klare farbcodierte Canvas-Kreise mit Bob-Animation
- Gate-Pfosten: rote/grüne Marker
- Alle Marken werfen gezeichnete weiche Contact-Shadows

### 8. Schatten
- Keine Licht-/Shadow-Map-Abhängigkeit
- Schatten werden als weiche, dunkle Ellipsen direkt ins Canvas gezeichnet

### 9. HUD
- **HTML-Overlay** (kein Canvas-Zeichnen)
- Oben rechts: Phase, Zeit, Geschwindigkeit, nächste Tonne + Distanz
- Wind-Kompass: reiner HTML-SVG oder Canvas-Element (klein, oben links)
- Klares, minimalistisches Design: dunkler semi-transparenter Hintergrund, heller Text

### 10. Menü & Sound
- Startmenü, Tutorial, Finish-Overlay: HTML-Overlays (wie bisher)
- Sound: unverändert (Web Audio API)
- Highscores: localStorage, Top 5

### 11. Steuerung
| Taste | Aktion |
|-------|--------|
| `←` / `→` | Ruder |
| `↑` / `↓` | Segeltrimm |
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
| 6 | Three.js Foundation: Scene, OrthoCam, Renderer, HUD-Overlay | ✓ |
| 7 | 3D Wasser: ShaderMaterial, GLSL-Wellen | ✓ |
| 8 | 3D Boot & Segel: Rumpf, Mast, Segel-Mesh, Bugwellen-Partikel | ✓ |
| 9 | 3D Bojen & Gate: Cylinder-Meshes, Bob-Animation | ✓ |
| 10 | Arcade-Tuning: Kurs kompakt, Boot schneller, Wind 14 kn | ✓ |
| 11 | Licht, Schatten, Polish | ✓ |
| 12 | Rueckbau auf Canvas 2D, Contact-Shadows statt Three.js | ✓ |

---

**Letztes Update**: 28. Juni 2026 – Canvas-2D-Rueckbau abgeschlossen
**Autor**: Patrick + Claude
