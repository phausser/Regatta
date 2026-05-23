# GeoSail Regatta

Minimalistische 2D-Segel-Regatta-Simulation im Browser. Top-Down, geometrischer Look, echter scheinbarer Wind.

## Starten

`index.html` direkt im Browser öffnen – kein Build-Schritt nötig.

## Steuerung

| Taste | Aktion |
|-------|--------|
| `←` `→` | Ruder (Boot drehen) |
| `↑` `↓` | Segel trimmen (einholen / fieren) |
| `R` | Reef togglen (Segelfläche −40 %) |
| `T` | Rennen neu starten |
| `Esc` | Zurück zum Hauptmenü |
| `M` | Ton stummschalten |
| `+` `−` / Mausrad | Zoom |
| `D` | Debug-Overlay ein/aus |

## Spielablauf

1. Im Startmenü **Rennen starten** oder **Tutorial** wählen (Tastatur oder Maus)
2. Startlinie zwischen roter und grüner Boje von Süd nach Nord kreuzen
3. Alle 3 Tonnen in Reihenfolge runden
4. Zurück durchs Zieltor – Zeit wird gestoppt und in den Bestzeiten (Top 5) gespeichert

## Physik-Grundlagen

- **True Wind** (cyan) – tatsächliche Windrichtung und -stärke
- **Apparent Wind** (orange) – resultierender Wind aus True Wind + Bootsbewegung; entscheidend für den Trimm
- **No-Go-Zone** – innerhalb ~34° gegen den Wind kommt das Boot nicht voran
- **Polarkurve** – breiterer Raumschoter (~120° AWA) ist die schnellste Kurslage
- **Trimm** – Segel-Trimm dem Apparent Wind anpassen; Segel leuchtet gelb (gut), orange (zu eng) oder rot-flatternd (zu weit)

## Projektstruktur

```
js/
  input.js     – Tastatur + Maus-State
  camera.js    – Welt ↔ Screen-Transformation, Follow + Zoom
  wind.js      – True Wind mit langsamem Drift
  boat.js      – Boot-Physik, Segel, Rendering
  race.js      – Bojen, Start-/Zieltor, Renn-Logik, HUD
  renderer.js  – Wasser, Wellenlinien, Bugwellen, Windkompass
  audio.js     – Web Audio API: Wind, Wellen, Flattern, Pings, Fanfare
  tutorial.js  – Interaktives 4-Schritte-Tutorial
  ui.js        – Startmenü, Finish-Overlay, Highscores (localStorage)
  debug.js     – Debug-Overlay (D-Taste)
  main.js      – Game Loop, State-Machine (menu/tutorial/game)
```

## Roadmap

- **Phase 0** ✓ Canvas, Game Loop, Kamera, Debug
- **Phase 1** ✓ Boot, Ruder, Segel, True/Apparent Wind, Kraft
- **Phase 2** ✓ Wind-Visualisierung, detailliertes Segel-Trim-Modell, Reefing
- **Phase 3** ✓ Rennstrecke – Bojen, Start/Ziel, Zeitmessung
- **Phase 4** ✓ Wasser-Rendering, HUD, Bugwellen
- **Phase 5** ✓ Menü, Tutorial, Highscores, Sound
