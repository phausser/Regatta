# AGENTS.md – GeoSail Regatta

Dieses Dokument richtet sich an KI-Agenten (z. B. Claude Code), die an diesem Projekt arbeiten.

## Projektübersicht

Minimalistisches 3D-Segel-Regatta-Spiel im Browser. Top-Down-Ansicht (senkrecht von oben), echte Segelphysik (Scheinbarer Wind), Rundkurs mit Bojen. Rendering via **Three.js** (WebGL).

- **Tech-Stack**: HTML5, Vanilla JavaScript, Three.js r168 (CDN) – kein Framework, kein Build-Step
- **Einstieg**: `index.html` direkt im Browser öffnen
- **Welt**: 5000 × 5000 Einheiten, Kamera folgt dem Boot

## Dateistruktur

```
index.html            Einstiegspunkt, lädt Three.js + alle Scripts
js/
  input.js            Tastatur + Maus-State (isDown / isPressed / isClick / flush)
  wind.js             True Wind + langsame Drift                        ← Phase 2 (unverändert)
  boat.js             Boot-Physik + Apparent Wind (KEIN draw() mehr)    ← Phase 1 + 8
  race.js             Bojen, Start-/Zieltor, Renn-Logik (KEIN draw())   ← Phase 3 + 9
  scene.js            Three.js: Scene, WebGLRenderer, OrthoCam, Lichter ← Phase 6 (NEU)
  waterMesh.js        3D-Wasser: ShaderMaterial + GLSL-Wellen           ← Phase 7 (NEU)
  boatMesh.js         3D-Rumpf, Mast, Segel-Mesh, Bugwellen-Partikel   ← Phase 8 (NEU)
  marksMesh.js        3D-Bojen, Gate-Pfosten, Bob-Animation             ← Phase 9 (NEU)
  audio.js            Web Audio API – Wind, Wellen, Flattern, Pings     ← Phase 5 (unverändert)
  tutorial.js         Interaktives 4-Schritte-Tutorial (HTML-Overlay)   ← Phase 5
  ui.js               Startmenü, HUD, Finish-Overlay (HTML-Overlay)     ← Phase 5 + 6
  debug.js            Debug-Overlay (Toggle: D-Taste)
  main.js             Game Loop, State-Machine, resize, update/render
```

**Entfernt in Phase 6:**
- `camera.js` → Camera-Logik lebt in `scene.js` (Three.js OrthographicCamera)
- `renderer.js` → vollständig ersetzt durch `waterMesh.js`, `boatMesh.js`, `marksMesh.js`

**Script-Ladereihenfolge** (global, keine Module):
`input → wind → boat → race → scene → waterMesh → boatMesh → marksMesh → audio → tutorial → ui → debug → main`

## Koordinatensystem & Konventionen

- **Weltkoordinaten**: X nach rechts, Y nach unten (wie bisher für Physik)
- **Three.js**: Weltkoordinaten werden nach Three.js übersetzt: `threeX = worldX`, `threeZ = worldY` (Y ist oben in Three.js, wird für Top-Down-Kamera nicht benötigt)
- **Winkel**: Radiant, 0 = nach oben (Norden), im Uhrzeigersinn
- **Geschwindigkeit**: Welt-Einheiten pro Sekunde
- **Knoten**: Nur für HUD-Anzeige; interne Physik rechnet in WE/s
- **Delta-Time**: `update(dt)` erhält `dt` in Sekunden, gekappt auf 0,1 s

## Three.js Kamera

```
OrthographicCamera, schaut senkrecht nach unten (Y-Achse negativ).
Camera-Position: (boat.x, HIGH_Y, boat.z)
Camera-Rotation: lookAt(boat.x, 0, boat.z)
Zoom: anpasst left/right/top/bottom der OrthoCam
```

Kein Tilt, keine Rotation um die Y-Achse – Ansicht bleibt immer senkrecht von oben.

## Globale Objekte

| Objekt      | Datei        | Beschreibung                                       |
|-------------|--------------|----------------------------------------------------|
| `Input`     | input.js     | Tastatur + Maus-State                              |
| `Wind`      | wind.js      | True Wind (dir, speed, vx, vy)                     |
| `Boat`      | boat.js      | Boot-Zustand + Physik (kein Rendering)             |
| `Race`      | race.js      | Renn-Logik, Wegpunkte, Zeitmessung (kein Rendering)|
| `Scene`     | scene.js     | Three.js Scene, Camera, Renderer, Lichter          |
| `WaterMesh` | waterMesh.js | Animiertes Wasser-Mesh (ShaderMaterial)            |
| `BoatMesh`  | boatMesh.js  | 3D-Boot + Segel + Bugwellen-Partikel               |
| `MarksMesh` | marksMesh.js | 3D-Bojen und Gate-Pfosten                          |
| `Sfx`       | audio.js     | Web Audio API – Ambient + One-shots                |
| `Tutorial`  | tutorial.js  | 4-Schritte-Tutorial                                |
| `UI`        | ui.js        | Startmenü, HUD-Overlay, Finish-Overlay, Highscores |
| `Debug`     | debug.js     | Debug-Overlay                                      |

## Game-State-Machine (main.js)

`gameScreen` ∈ `'menu' | 'tutorial' | 'game'`

- `startGame()` – Race.reset(), gameScreen = 'game'
- `startTutorial()` – Race.reset(), Tutorial.begin(), gameScreen = 'tutorial'
- `goToMenu()` – gameScreen = 'menu'
- Tutorial → 'game': automatisch wenn `Tutorial.isDone()`
- Highscore einmalig gespeichert wenn `Race.phase === 'finished'`

## HUD (HTML-Overlay)

Das HUD ist **kein Canvas-Zeichnen mehr**, sondern ein `<div id="hud">` über dem WebGL-Canvas.
`ui.js` schreibt `element.textContent` statt `ctx.fillText(...)`.
Wind-Kompass: kleines `<canvas>`-Element im HUD für die Pfeil-Animation (2D Canvas, mini).

## Visueller Stil

**Clean und minimalistisch** – dieser Grundsatz ist nicht verhandelbar:
- Keine unnötigen Dekorationen, kein Lärm
- Jedes visuelle Element hat eine klare Funktion
- Texturen: keine (außer GLSL-generierte Wasser-Muster)
- Geometrie: primitiv und klar – Zylinder, Extrusions, Planes
- Farbpalette konsequent einhalten (siehe SPEC.md)

## Coding-Stil

- **Einfach und lesbar** – kein cleverer Code auf Kosten der Verständlichkeit
- Alle Module sind einfache `const`-Objekte (kein ES6-Klassen-Zwang)
- Keine externen Abhängigkeiten außer Three.js via CDN
- Kommentare nur wenn das *Warum* nicht offensichtlich ist
- Deutsche Kommentare sind ok

## Arbeitsweise

- Phasen 6–11 werden einzeln abgeschlossen; nach jeder Phase prüft Patrick den Stand
- Nach jeder Phase: TODO.md, SPEC.md Status-Tabelle, AGENTS.md aktualisieren
- Keine Phase überspringen oder parallel implementieren
- Aktueller Stand: Phase 9 abgeschlossen; nächster Fokus ist Phase 10 (Arcade-Tuning)

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

## Kurs-Koordinaten (Phase 10)

| Element       | Welt-X | Welt-Y | Beschreibung |
|---------------|--------|--------|--------------|
| Gate Port     | 2200   | 2600   | rot          |
| Gate Stbd     | 2800   | 2600   | grün         |
| Mark 1        | 2000   | 2100   | gelb, Luv    |
| Mark 2        | 3000   | 2100   | gelb, Raumschots |
| Mark 3        | 2500   | 3000   | gelb, Lee    |
| Boot Start    | 2500   | 2800   | –            |
| Tonnen-Radius | 90 WE  | –      | –            |

Ziel-Rundenzeit: 5–8 Minuten.

## Wichtige Konstanten

| Konstante      | Wert  | Datei       |
|----------------|-------|-------------|
| `WORLD_SCALE`  | 20    | boat.js     |
| Weltgröße      | 5000² | main.js     |
| Wind Standard  | 14 kn | wind.js     |
| TURN_RATE      | 1.2   | boat.js     |
| Speed-Faktor   | 1.35  | boat.js     |
