# GeoSail Regatta

Minimalistische 2D-Segel-Regatta-Simulation im Browser. Top-Down, geometrischer Look, echter scheinbarer Wind.

## Starten

`index.html` direkt im Browser öffnen – kein Build-Schritt nötig. Für Online-Bestzeiten muss der Highscore-Server laufen.

## Steuerung

| Taste | Aktion |
|-------|--------|
| `←` `→` | Ruder (Boot drehen) |
| `↑` | Segel fieren |
| `↓` | Segel einholen |
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
4. Zurück durchs Zieltor – Zeit wird gestoppt und an den Highscore-Server gesendet

## Physik-Grundlagen

- **True Wind** (blau) – tatsächliche Windrichtung und -stärke; Kompasspfeil zeigt, woher der Wind kommt
- **Apparent Wind** (rot) – resultierender Wind aus True Wind + Bootsbewegung; Kompasspfeil zeigt, woher der scheinbare Wind kommt
- **No-Go-Zone** – innerhalb ~34° gegen den Wind kommt das Boot nicht voran
- **Polarkurve** – breiterer Raumschoter (~120° AWA) ist die schnellste Kurslage
- **Trimm** – Segel-Trimm dem Apparent Wind anpassen

## Server

Der Server speichert die globalen Top-5-Bestzeiten in SQLite. Lokale Browser-Highscores werden nicht mehr verwendet.

### Installation

```bash
cd server
pip install -r requirements.txt
python app.py
```

Falls Port 5000 belegt ist:

```bash
PORT=5050 python app.py
```

Dann im Browser vor dem Spielstart die API-URL setzen:

```js
window.GEOSAIL_SCORE_API = 'http://localhost:5050'
```

### Endpoints

* `GET /health` — Healthcheck
* `POST /start-session` — Session + Secret fuer ein Rennen erzeugen
* `POST /submit-score` — Zeit + Hash validieren und speichern
* `GET /leaderboard?limit=10` — Top-Zeiten abrufen (max. 100)

### Sicherheit

* One-time Secret pro Rennen
* Browser-Signatur aus normalen Request-Headern
* Hash-Prüfung (Zeit + Secret + Spielername)
* Session-Timeout
* Zeit-Plausibilitaet: 3 min < Zeit < 60 min
* Eingereichte Zeit darf nicht kuerzer als die Session-Laufzeit sein
