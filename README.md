# Regatta

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

Der Server speichert die globalen Top-5-Bestzeiten in SQLite.

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
