# AGENTS.md – GeoSail Regatta

Dieses Dokument richtet sich an KI-Agenten (z. B. Claude Code), die an diesem Projekt arbeiten.

## Projektübersicht

Minimalistisches 2D-Segel-Regatta-Spiel im Browser. Top-Down-Ansicht (senkrecht von oben), echte Segelphysik (Scheinbarer Wind), Rundkurs mit Bojen. Rendering via **HTML5 Canvas**.

- **Tech-Stack**: HTML5 Canvas, Vanilla JavaScript, Web Audio API – kein Framework, kein Build-Step
- **Einstieg**: `index.html` direkt im Browser öffnen; für Highscores zusätzlich Flask-Server starten
- **Welt**: 5000 × 5000 Einheiten, Kamera folgt dem Boot

## Dateistruktur

```
index.html            Einstiegspunkt, lädt alle Scripts
js/
  input.js            Tastatur + Maus-State (isDown / isPressed / isClick / flush)
  wind.js             True Wind + langsame Drift                        ← Phase 2 (unverändert)
  boat.js             Boot-Physik + Apparent Wind (KEIN draw() mehr)    ← Phase 1 + 8
  race.js             Bojen, Start-/Zieltor, Renn-Logik (KEIN draw())   ← Phase 3 + 9
  scene.js            Canvas, Follow-Kamera, Zoom, Render-Orchestrierung
  waterMesh.js        Canvas-Wasserverlauf + animierte Dreiecks-Wellen
  boatMesh.js         Bootssilhouette, Segel, Bugpixel, projizierter Schatten
  marksMesh.js        Bojen, Gate, Kurslinien, projizierte Schatten
  audio.js            Web Audio API – Wind, Wellen, Flattern, Pings     ← Phase 5 (unverändert)
  tutorial.js         Interaktives 4-Schritte-Tutorial (HTML-Overlay)   ← Phase 5
  scoreApi.js         Client-Anbindung an den Highscore-Server
  ui.js               Startmenü, HUD, Finish-Overlay (HTML-Overlay)     ← Phase 5 + 6
  debug.js            Debug-Overlay (Toggle: D-Taste)
  main.js             Game Loop, State-Machine, resize, update/render
server/
  app.py              Flask-Server für globale Highscores
  requirements.txt    Python-Abhängigkeiten
```

**Entfernt:**
- `camera.js` → Camera-Logik lebt in `scene.js`
- `renderer.js` → ersetzt durch `scene.js`, `waterMesh.js`, `boatMesh.js`, `marksMesh.js`
- Three.js-CDN → Rückbau auf Canvas 2D

**Script-Ladereihenfolge** (global, keine Module):
`input → wind → boat → race → scene → waterMesh → boatMesh → marksMesh → audio → tutorial → scoreApi → ui → debug → main`

## Koordinatensystem & Konventionen

- **Weltkoordinaten**: X nach rechts, Y nach unten (wie bisher für Physik)
- **Canvas**: Weltkoordinaten werden direkt gezeichnet; Kamera transformiert per `translate/scale`
- **Winkel**: Radiant, 0 = nach oben (Norden), im Uhrzeigersinn
- **Wind.dir**: Richtung, in die der wahre Wind weht; Kompasspfeil zeigt `dir + π` (woher der Wind kommt)
- **Geschwindigkeit**: Welt-Einheiten pro Sekunde
- **Knoten**: Nur für HUD-Anzeige; interne Physik rechnet in WE/s
- **Delta-Time**: `update(dt)` erhält `dt` in Sekunden, gekappt auf 0,1 s

## Canvas-Kamera

```
Canvas 2D, senkrecht von oben.
Screen: (world - cameraCenter) * zoom + viewportCenter
Zoom: skaliert die Canvas-Welttransformation
```

Kein Tilt, keine Rotation um die Y-Achse – Ansicht bleibt immer senkrecht von oben.

## Globale Objekte

| Objekt      | Datei        | Beschreibung                                       |
|-------------|--------------|----------------------------------------------------|
| `Input`     | input.js     | Tastatur + Maus-State                              |
| `Wind`      | wind.js      | True Wind (dir, speed, vx, vy)                     |
| `Boat`      | boat.js      | Boot-Zustand + Physik (kein Rendering)             |
| `Race`      | race.js      | Renn-Logik, Wegpunkte, Zeitmessung (kein Rendering)|
| `Scene`     | scene.js     | Canvas, Kamera, Render-Orchestrierung              |
| `WaterMesh` | waterMesh.js | Wasserverlauf und animierte Wind-Wellen            |
| `BoatMesh`  | boatMesh.js  | Boot, Segel, Bugpixel und projizierter Schatten    |
| `MarksMesh` | marksMesh.js | Bojen, Gate, Kurslinien und projizierte Schatten   |
| `Sfx`       | audio.js     | Web Audio API – Ambient + One-shots                |
| `Tutorial`  | tutorial.js  | 4-Schritte-Tutorial                                |
| `ScoreApi`  | scoreApi.js  | Server-Highscores: Session, Submit, Leaderboard    |
| `UI`        | ui.js        | Startmenü, HUD-Overlay, Finish-Overlay, Highscores |
| `Debug`     | debug.js     | Debug-Overlay                                      |

## Game-State-Machine (main.js)

`gameScreen` ∈ `'menu' | 'tutorial' | 'game'`

- `startGame()` – Race.reset(), gameScreen = 'game'
- `startTutorial()` – Race.reset(), Tutorial.begin(), gameScreen = 'tutorial'
- `goToMenu()` – gameScreen = 'menu'
- Tutorial → 'game': automatisch wenn `Tutorial.isDone()`
- Score-Session startet beim Übergang `pre_start` → `racing`
- Highscore wird einmalig an den Server gesendet wenn `Race.phase === 'finished'`

## HUD (HTML-Overlay)

Das HUD ist **kein Spiel-Canvas-Zeichnen**, sondern ein `<div id="hud">` über dem Canvas.
`ui.js` schreibt `element.textContent` statt `ctx.fillText(...)`.
Wind-Kompass: kleines `<canvas>`-Element im HUD für die Pfeil-Animation (2D Canvas, mini).
Die Kompasspfeile zeigen, woher wahrer und scheinbarer Wind kommen; die Wasserwellen bewegen sich in die Richtung, in die der wahre Wind weht.
Kursindikatoren werden im Spiel-Canvas gezeichnet: alle Dreiecke liegen ca. 100 px um das Boot und zeigen zum jeweiligen Zielobjekt.

## Highscore-Server

- Server: `server/app.py` (Flask + SQLite)
- Start: `cd server && python app.py`
- Default-URL im Client: `http://localhost:5000`
- Alternative URL: vor dem Spielstart `window.GEOSAIL_SCORE_API = 'http://localhost:5050'` setzen
- `GET /health` prüft Serverstatus
- `POST /start-session` erzeugt Session-ID und Secret beim Rennstart
- `POST /submit-score` validiert Zeit, Session, Browser-Signatur und Hash
- `GET /leaderboard?limit=5` liefert die Startmenü-/Finish-Bestzeiten
- Keine localStorage-Highscores mehr; bei Serverfehler zeigt die UI einen Serverstatus statt lokaler Fallback-Liste
- Zeit-Plausibilität: `180 < time < 3600`, außerdem `time >= session_age`

## Visueller Stil

**Clean und minimalistisch** – dieser Grundsatz ist nicht verhandelbar:
- Keine unnötigen Dekorationen, kein Lärm
- Jedes visuelle Element hat eine klare Funktion
- Texturen: keine
- Geometrie: primitiv und klar – Canvas-Formen, Kreise, Polygone, Ellipsen
- Schatten sind formbasierte Projektionen aus Sonnenposition und Objekthöhe, keine Ellipsen-Dummies
- Farbpalette konsequent einhalten (siehe SPEC.md)

## Coding-Stil

- **Einfach und lesbar** – kein cleverer Code auf Kosten der Verständlichkeit
- Alle Module sind einfache `const`-Objekte (kein ES6-Klassen-Zwang)
- Keine externen Rendering-Abhängigkeiten
- Kommentare nur wenn das *Warum* nicht offensichtlich ist
- Deutsche Kommentare sind ok

## Arbeitsweise

- Phasen werden einzeln abgeschlossen; nach jeder Phase prüft Patrick den Stand
- Nach jeder Phase: TODO.md, SPEC.md Status-Tabelle, AGENTS.md aktualisieren
- Keine Phase überspringen oder parallel implementieren
- Aktueller Stand: Server-Highscores abgeschlossen

## Steuerung

| Taste            | Aktion                        |
|------------------|-------------------------------|
| `←` / `→`        | Ruder links / rechts          |
| `↑`              | Segel fieren                  |
| `↓`              | Segel einholen                |
| `R`              | Reef togglen                  |
| `T`              | Rennen neu starten            |
| `H`              | Test-Finish speichern         |
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
