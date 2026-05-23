# GeoSail Regatta

Minimalistische 2D-Segel-Regatta-Simulation im Browser. Top-Down, geometrischer Look, echter scheinbarer Wind.

## Starten

`index.html` direkt im Browser öffnen – kein Build-Schritt nötig.

## Steuerung

| Taste | Aktion |
|-------|--------|
| `←` `→` | Ruder (Boot drehen) |
| `↑` `↓` | Segel trimmen (einholen / fieren) |
| `+` `−` | Zoom |
| `D` | Debug-Overlay ein/aus |

## Physik-Grundlagen

- **True Wind** (cyan) – tatsächliche Windrichtung und -stärke
- **Apparent Wind** (orange) – resultierender Wind aus True Wind + Bootsbewegung; entscheidend für den Trimm
- **No-Go-Zone** – innerhalb ~34° gegen den Wind kommt das Boot nicht voran
- **Polarkurve** – breiterer Raumschoter (~120° AWA) ist die schnellste Kurslage
- **Trimm** – falscher Segel-Trimm kostet Geschwindigkeit; ↑/↓ dem Apparent Wind anpassen

## Projektstruktur

```
js/
  input.js   – Tastatur-State
  camera.js  – Welt ↔ Screen-Transformation, Follow + Zoom
  wind.js    – True Wind mit langsamem Drift
  boat.js    – Boot-Physik, Segel, Rendering
  debug.js   – Debug-Overlay
  main.js    – Game Loop, Update, Draw
```

## Roadmap

- **Phase 0** ✓ Canvas, Game Loop, Kamera, Debug
- **Phase 1** ✓ Boot, Ruder, Segel, True/Apparent Wind, Kraft
- **Phase 2** Wind-Visualisierung, detailliertes Segel-Trim-Modell
- **Phase 3** Rennstrecke – Bojen, Start/Ziel, Zeitmessung
- **Phase 4** Wasser-Rendering, HUD, Bugwellen
- **Phase 5** Menü, Highscores, Polish
