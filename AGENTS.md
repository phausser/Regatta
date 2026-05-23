# AGENTS.md – GeoSail Regatta

Dieses Dokument richtet sich an KI-Agenten (z. B. Claude Code), die an diesem Projekt arbeiten.

## Projektübersicht

Minimalistische 2D-Segel-Regatta-Simulation im Browser. Top-Down-Ansicht, echte Segelphysik (Scheinbarer Wind), Rundkurs mit Bojen.

- **Tech-Stack**: HTML5, Vanilla JavaScript, Canvas 2D – kein Framework, kein Build-Step
- **Einstieg**: `index.html` direkt im Browser öffnen
- **Welt**: 5000 × 5000 Einheiten, Kamera folgt dem Boot

## Dateistruktur

```
index.html          Einstiegspunkt, lädt alle Scripts in Reihenfolge
js/
  input.js          Tastatur + Maus-State (isDown / isPressed / isClick / flush)
  camera.js         Welt↔Screen-Koordinaten, Camera.follow()
  wind.js           True Wind + langsame Drift                        ← Phase 2
  boat.js           Boot-Physik, Segel-Trim, Rendering                ← Phase 1
  race.js           Bojen, Start-/Zieltor, Renn-Logik, HUD            ← Phase 3
  renderer.js       Wasser, Wellenlinien, Bugwellen, Windkompass       ← Phase 4
  audio.js          Web Audio API – Wind, Wellen, Flattern, Pings      ← Phase 5
  tutorial.js       Interaktives 4-Schritte-Tutorial                   ← Phase 5
  ui.js             Startmenü, Finish-Overlay, Highscores              ← Phase 5
  debug.js          Debug-Overlay (Toggle: D-Taste)
  main.js           Game Loop, State-Machine, resize, update/draw
```

**Script-Ladereihenfolge** (keine Module, alles global):
`input → camera → wind → boat → race → renderer → audio → tutorial → ui → debug → main`

## Koordinatensystem & Konventionen

- **Weltkoordinaten**: X nach rechts, Y nach unten (Standard-Canvas)
- **Winkel**: Radiant, 0 = nach oben (Norden), im Uhrzeigersinn
- **Geschwindigkeit**: Welt-Einheiten pro Sekunde (1 WE ≈ 1 Meter)
- **Knoten**: Nur für HUD-Anzeige; interne Physik rechnet in WE/s
- **Delta-Time**: Jede `update(dt)`-Funktion erhält `dt` in Sekunden; `dt` ist auf 0,1 s gekappt

## Globale Objekte

| Objekt     | Datei        | Beschreibung                                       |
|------------|--------------|----------------------------------------------------|
| `Input`    | input.js     | Tastatur + Maus-State                              |
| `Camera`   | camera.js    | Kamera-Zustand + Koordinaten-Helfer                |
| `Wind`     | wind.js      | True Wind (dir, speed, vx, vy)                     |
| `Boat`     | boat.js      | Boot-Zustand + Physik + Rendering                  |
| `Race`     | race.js      | Renn-Logik, Wegpunkte, Zeitmessung                 |
| `Renderer` | renderer.js  | Wasser, Partikel, Windkompass                      |
| `Sfx`      | audio.js     | Web Audio API – Ambient + One-shots                |
| `Tutorial` | tutorial.js  | 4-Schritte-Tutorial mit Fortschrittsanzeige        |
| `UI`       | ui.js        | Startmenü, Finish-Overlay, Highscores (localStorage)|
| `Debug`    | debug.js     | Debug-Overlay                                      |
| `state`    | main.js      | Geteilter Zustand (fps)                            |

## Game-State-Machine (main.js)

`gameScreen` ∈ `'menu' | 'tutorial' | 'game'`

- `startGame()` – Race.reset(), gameScreen = 'game'
- `startTutorial()` – Race.reset(), Tutorial.begin(), gameScreen = 'tutorial'
- `goToMenu()` – gameScreen = 'menu'
- Tutorial → 'game': automatisch wenn `Tutorial.isDone()`
- Highscore wird einmalig gespeichert wenn `Race.phase === 'finished'`

## Coding-Stil

- **Einfach und lesbar** – kein cleverer Code auf Kosten der Verständlichkeit
- Alle Module sind einfache `const`-Objekte (kein ES6-Klassen-Zwang)
- Keine externen Abhängigkeiten, keine npm-Pakete
- Kommentare nur wenn das *Warum* nicht offensichtlich ist
- Deutsche Kommentare sind ok (Projektsprache ist Deutsch/Englisch gemischt)

## Arbeitsweise

- Phasen werden einzeln abgeschlossen; nach jeder Phase prüft Patrick den Stand
- TODO.md, SPEC.md und AGENTS.md nach jeder Phase aktualisieren
- Keine Phase überspringen oder parallel implementieren

## Steuerung

| Taste            | Aktion                        |
|------------------|-------------------------------|
| `←` / `→`        | Ruder links / rechts          |
| `↑` / `↓`        | Segeltrimm einholen / fieren  |
| `R`              | Reef togglen                  |
| `T`              | Rennen neu starten            |
| `Esc`            | Zurück zum Hauptmenü          |
| `M`              | Ton stummschalten             |
| `+` / `−` / Rad  | Zoom                          |
| `D`              | Debug-Overlay                 |

## Physik-Kurzreferenz

```
apparentWind = trueWind - boatVelocityVector
sailForce    = f(angle(apparentWind, sailAngle), sailArea)
thrust       = sailForce · cos(angle to boat heading)
drift        = sailForce · sin(angle to boat heading)
```

AWA-Konvention: 0° = Wind von vorne (No-Go), 90° = optimaler Schub (Beam Reach).
No-Go-Zone: |AWA| < 0,60 rad (~34°).

## Wichtige Konstanten

| Konstante      | Wert  | Datei       |
|----------------|-------|-------------|
| `WORLD_SCALE`  | 20    | boat.js     |
| Weltgröße      | 5000² | main.js     |
| Gate Port      | 2100, 2600 | race.js |
| Gate Stbd      | 2900, 2600 | race.js |
| Tonnen         | (1600,1100), (3800,1300), (2500,3200) | race.js |
| Tonnen-Radius  | 90    | race.js     |
| Startposition  | 2500, 2800 | boat.js |
