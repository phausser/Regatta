# GeoSail Regatta – Projekt-Spezifikation

## Allgemeines
- **Projektname**: GeoSail Regatta
- **Typ**: Minimalistische 2D Segel-Regatta Simulation
- **Technik**: HTML5, Vanilla JavaScript, Canvas 2D
- **Ansicht**: Top-Down (von oben)
- **Ziel**: Spaßiges, lehrreiches Segelspiel mit Fokus auf Physik, Wind und Segeltrimm

## Kern-Features

### 1. Spielwelt
- Große offene See (5000 × 5000 Welt-Einheiten)
- Zentrale Kamera folgt dem Boot
- **Geometrischer Wasser-Effekt**:
  - Kacheln mit sinus-animierter Helligkeit, windabhängige Farbgebung
  - Wellenlinien senkrecht zur Windrichtung, weltverankert scrollend
  - Bugwellen / Schaum-Partikel (zwei Fächer am Bug)

### 2. Boot & Segel
- Geometrisches Boot (Dreieck + Kiel + Ruder)
- Großsegel als Bezier-Kurve mit Wölbung, einstellbarer Winkel
- Visuelles Trim-Feedback: gelb (gut), orange (zu eng), rot-flatternd (luffing)
- Reefing: Segelfläche −40 %, R-Taste

### 3. Physik
- Echter **scheinbarer Wind** (Apparent Wind)
- Schub abhängig von AWA (Polarkurve), Trimm-Effizienz, Segelfläche
- Trägheit, Rudereffekt, seitliche Drift (Leeway)
- No-Go-Zone: |AWA| < ~34°

### 4. Wind-System
- True Wind: Basisrichtung + Stärke (Standard: 8 kn aus Ost)
- Langsame Änderungen (±15° alle 15–40 Sekunden)
- Apparent Wind: True Wind − Bootsgeschwindigkeitsvektor

### 5. Wind-Darstellung
- **True Wind Pfeil** (cyan) + **Apparent Wind Pfeil** (orange) im Kompass-HUD (unten rechts)
- Numerische Anzeigen: TWD/TWS und AWA/AWS in Knoten + Grad

### 6. Regatta-Elemente
- Starttor: zwei Bojen (rot/grün) + Linie; Kreuzung süd→nord startet Rennen
- 3 Rundungsbojen in Reihenfolge (Approach-Guard: erst ab 2,5× Radius aktiv)
- Zieltor (dasselbe Gate, erneute Kreuzung)
- HUD oben rechts: Phase, Zeit (mm:ss.t), Geschwindigkeit, Seemeilen, nächste Boje + Distanz
- Bestzeiten: Top 5 in localStorage gespeichert

### 7. Menü & UI
- Animiertes Startmenü (Tastatur + Maus)
- Interaktives Tutorial: 4 in-game Schritte mit Bottom-Panel-Overlay und Fortschrittsbalken
- Finish-Overlay: Zeit, Rang, Bestzeiten-Liste, Buttons (Nochmal / Hauptmenü)
- Escape → zurück zum Menü; T → Neustart

### 8. Sound
- Web Audio API, keine Audiodateien
- Wind-Rauschen: Lautstärke + Filterfrequenz skalieren mit Windstärke
- Fahrtgeräusch (Bugwellen): skaliert mit Bootsgeschwindigkeit
- Segel-Flattern: Bandpass-Rauschen mit LFO, aktiv bei sailState = luffing
- Bojen-Ping beim Runden jeder Tonne
- C-Dur-Fanfare beim Zieleinlauf
- M-Taste: Stummschalten

### 9. Steuerung
- Pfeiltasten: Ruder + Segeltrimm
- R = Reef, T = Neustart, Esc = Menü, M = Mute
- Zoom: +/−/Mausrad
- Maus: Menü-Navigation + Buttons

### 10. Ästhetik
- Minimalistisch, geometrisch, clean
- Farbpalette: Tiefblau, Türkis, Weiß, Orange-Akzente
- Klare HUD-Elemente

## Technische Anforderungen
- Delta-Time basierter Game-Loop (dt gekappt auf 0,1 s)
- Vektor-Mathematik für Physik
- Saubere Trennung der Module (siehe AGENTS.md)
- Responsive Canvas (window resize)
- Kein Build-Step – reines HTML5 + Vanilla JS, direkt im Browser öffnen
- AudioContext lazy initialisiert (Autoplay-Policy-konform)

## Status

| Phase | Inhalt | Status |
|-------|--------|--------|
| 0 | Canvas, Game Loop, Kamera, Debug | ✓ |
| 1 | Boot, Ruder, Segel, True/Apparent Wind, Kraft | ✓ |
| 2 | Wind-Visualisierung, Trim-Modell, Reefing | ✓ |
| 3 | Rennstrecke, Bojen, Start/Ziel, Zeitmessung | ✓ |
| 4 | Wasser-Rendering, HUD, Bugwellen | ✓ |
| 5 | Menü, Tutorial, Highscores, Sound | ✓ |

---

**Letztes Update**: 24. Mai 2026 – Phase 5 abgeschlossen  
**Autor**: Grok + Patrick
