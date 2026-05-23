# GeoSail Regatta – Projekt-Spezifikation

## Allgemeines
- **Projektname**: GeoSail Regatta
- **Typ**: Minimalistische 2D Segel-Regatta Simulation
- **Technik**: HTML5, Vanilla JavaScript, Canvas 2D
- **Ansicht**: Top-Down (von oben)
- **Ziel**: Spaßiges, lehrreiches Segelspiel mit Fokus auf Physik, Wind und Segeltrimm

## Kern-Features

### 1. Spielwelt
- Große offene See (z.B. 5000 × 5000 Welt-Einheiten)
- Zentrale Kamera folgt dem Boot
- **Geometrischer Wasser-Effekt**:
  - Feines diagonales Wellengitter mit Sinus-Animation
  - Leichte Farb- und Helligkeitsvariation je nach Wind
  - Bugwellen / Schaum-Partikel

### 2. Boot & Segel
- Geometrisches Boot (Dreieck + Kiel + Ruder)
- Großsegel als Dreieck, einstellbarer Winkel
- Reefing (Segel verkleinern)

### 3. Physik
- Echter **scheinbarer Wind** (Apparent Wind)
- Schub abhängig von:
  - Winkel zwischen Apparent Wind und Segel
  - Segelfläche
  - Bootsrichtung
- Trägheit, Rudereffekt, seitliche Drift

### 4. Wind-System
- True Wind: Basisrichtung + Stärke
- Langsame Änderungen (±8–15° alle 15–40 Sekunden)
- Apparent Wind: Berechnet aus True Wind + Bootsgeschwindigkeit/Vektor

### 5. Wind-Darstellung (aktualisiert)
- **True Wind Pfeil** (hellblau/cyan) – zeigt echte Windrichtung
- **Apparent Wind Pfeil** (orange/gelb) – zeigt relevanten Wind für Segeltrimm
- Beide Pfeile im HUD oben rechts
- Zusätzliche numerische Anzeigen (Knoten + Grad)

### 6. Regatta-Elemente
- Starttor (zwei Bojen + Linie)
- 3–5 Rundungsbojen (in Reihenfolge)
- Zieltor
- Zeitmessung, Knoten, zurückgelegte Seemeilen
- Nächste Boje + Distanz

### 7. Steuerung
- Pfeiltasten: Ruder + Segeltrim
- R = Reef togglen
- Optional: Maus zum Trimmen

### 8. Ästhetik
- Minimalistisch, geometrisch, clean
- Farbpalette: Tiefblau, Türkis, Weiß, Orange-Akzente
- Klare HUD-Elemente

## Technische Anforderungen
- Delta-Time basierter Game-Loop
- Vektor-Mathematik für Physik
- Saubere Trennung: `Boat.js`, `Wind.js`, `Race.js`, `Renderer.js`
- Responsive Canvas (window resize)
- Kein Build-Step – reines HTML5 + Vanilla JS, direkt im Browser öffnen

## MVP-Ziele
1. Boot + Physik + Segeltrim
2. True + Apparent Wind System
3. Windpfeile (True + Apparent)
4. 3 Bojen + Start/Ziel
5. Schönes Wasser + HUD
6. Timer + Geschwindigkeit

---

**Letztes Update**: 23. Mai 2026 – Phase 0 abgeschlossen
**Autor**: Grok + Patrick
