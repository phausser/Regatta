# AGENTS.md – GeoSail Regatta

Dieses Dokument richtet sich an KI-Agenten (z. B. Claude Code), die an diesem Projekt arbeiten.

## Projektübersicht

Minimalistische 2D-Segel-Regatta-Simulation im Browser. Top-Down-Ansicht, echte Segelphysik (Scheinbarer Wind), Rundkurs mit Bojen.

- **Tech-Stack**: HTML5, Vanilla JavaScript, Canvas 2D – kein Framework, kein Build-Step
- **Einstieg**: `index.html` direkt im Browser öffnen
- **Welt**: 5000 × 5000 Einheiten, Kamera folgt dem Boot

## Dateistruktur

```
index.html          Einstiegspunkt, lädt alle Scripts
js/
  input.js          Tastatur-State (isDown / isPressed / flush)
  camera.js         Welt↔Screen-Koordinaten, Camera.follow()
  debug.js          Debug-Overlay (Toggle: D-Taste)
  main.js           Game-Loop (delta-time), resize, update/draw
  boat.js           Boot-Klasse: Position, Rotation, Physik       ← Phase 1
  wind.js           True Wind + Apparent Wind, langsame Drift     ← Phase 2
  renderer.js       Alle draw-Funktionen (Wasser, Boot, HUD)      ← Phase 4
  race.js           Bojen, Start-/Zieltor, Renn-Logik             ← Phase 3
```

Scripts werden in `index.html` in dieser Reihenfolge geladen (keine Module, globale Objekte).

## Koordinatensystem & Konventionen

- **Weltkoordinaten**: X nach rechts, Y nach unten (Standard-Canvas)
- **Winkel**: Radiant, 0 = nach oben (Norden), im Uhrzeigersinn
- **Geschwindigkeit**: Welt-Einheiten pro Sekunde (1 WE ≈ 1 Meter)
- **Knoten**: Nur für HUD-Anzeige; interne Physik rechnet in WE/s
- **Delta-Time**: Jede `update(dt)`-Funktion erhält `dt` in Sekunden; `dt` ist auf 0,1 s gekappt

## Globale Objekte (aktuell verfügbar)

| Objekt   | Datei        | Beschreibung                          |
|----------|--------------|---------------------------------------|
| `Input`  | input.js     | Tastatur-State                        |
| `Camera` | camera.js    | Kamera-Zustand + Koordinaten-Helfer   |
| `Debug`  | debug.js     | Debug-Overlay                         |
| `state`  | main.js      | Geteilter Zustand (fps, später mehr)  |

## Coding-Stil

- **Einfach und lesbar** – kein cleverer Code auf Kosten der Verständlichkeit
- Alle Module sind einfache `const`-Objekte (kein ES6-Klassen-Zwang, außer Boat)
- Keine externen Abhängigkeiten, keine npm-Pakete
- Kommentare nur wenn das *Warum* nicht offensichtlich ist
- Deutsche Kommentare sind ok (Projektsprache ist Deutsch/Englisch gemischt)

## Arbeitsweise

- Phasen werden einzeln abgeschlossen; nach jeder Phase prüft Patrick den Stand
- TODO.md und SPEC.md nach jeder Phase aktualisieren
- Keine Phase überspringen oder parallel implementieren

## Steuerung (geplant)

| Taste        | Aktion              |
|--------------|---------------------|
| ← / →        | Ruder links / rechts |
| ↑ / ↓        | Segeltrimm ein / aus |
| R            | Reef togglen        |
| D            | Debug-Overlay       |

## Physik-Kurzreferenz (für Phase 1+)

```
apparentWind = trueWind - boatVelocityVector
sailForce    = f(angle(apparentWind, sailAngle), sailArea)
thrust       = sailForce · cos(angle to boat heading)
drift        = sailForce · sin(angle to boat heading)
```

Windwinkel-Konvention: 0° = Wind von vorne (kein Schub), 90° = optimaler Schub (Beam Reach).
