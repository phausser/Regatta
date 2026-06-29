# GeoSail Regatta

Minimalistische 2D-Segel-Regatta-Simulation im Browser. Top-Down, geometrischer Look, echter scheinbarer Wind.

## Starten

`index.html` direkt im Browser öffnen – kein Build-Schritt nötig.

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
4. Zurück durchs Zieltor – Zeit wird gestoppt und in den Bestzeiten (Top 5) gespeichert

## Physik-Grundlagen

- **True Wind** (blau) – tatsächliche Windrichtung und -stärke; Kompasspfeil zeigt, woher der Wind kommt
- **Apparent Wind** (rot) – resultierender Wind aus True Wind + Bootsbewegung; Kompasspfeil zeigt, woher der scheinbare Wind kommt
- **No-Go-Zone** – innerhalb ~34° gegen den Wind kommt das Boot nicht voran
- **Polarkurve** – breiterer Raumschoter (~120° AWA) ist die schnellste Kurslage
- **Trimm** – Segel-Trimm dem Apparent Wind anpassen

## Server

### Installation

```bash
cd server
pip install -r requirements.txt
python app.py
```

### Endpoints

* POST /start-session — Fingerprint senden → Secret bekommen
* POST /submit-score — Zeit + Hash + Fingerprint validieren & speichern
* GET /leaderboard?limit=10 — Top Zeiten abrufen (max 100)

### Sicherheit

* One-time Secret pro Rennen
* Fingerprint-Bindung
* Hash-Prüfung (Zeit + Secret + Spielername)
* Session-Timeout