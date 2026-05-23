# GeoSail Regatta – Todo Liste

## Phase 0: Setup ✓
- [x] HTML + Canvas Grundstruktur
- [x] Game Loop mit Delta Time
- [x] Kamera-System (Welt → Screen)
- [x] Debug Modus

## Phase 1: Boot & Physik ✓
- [x] Boat Klasse (Position, Velocity, Rotation, Inertia)
- [x] Rudermechanik (← →)
- [x] Basis-Segel (Winkel, Trimm ↑ ↓)
- [x] True Wind + Apparent Wind Berechnung
- [x] Kraftberechnung (Schub + Seitendrift / Leeway)

## Phase 2: Wind & Segel (Priorität)
- [x] True Wind Pfeil (cyan)
- [x] Apparent Wind Pfeil (orange)
- [x] Wind-Änderungssystem (langsame Drift)
- [x] Detailliertes Segel-Trim Model
- [x] Reefing Mechanik (R-Taste, −40% Fläche)
- [x] Visuelle Segelwölbung (Bezier, Farb-Feedback)

## Phase 3: Rennstrecke ✓
- [x] Bojen System + Kollisionserkennung (Proximity + Approach-Check)
- [x] Start- und Zieltor Logik (Linienkreuzung süd→nord)
- [x] Wegpunkt-Reihenfolge (3 Tonnen + Start/Ziel-Gate)
- [x] Renn-Zeitmessung (mm:ss.t)
- [x] Distanz / Seemeilen Zähler (nM)

## Phase 4: Visuelles ✓
- [x] Geometrisches Wasser-Rendering (Kacheln + animierte Wellenlinien)
- [x] Boot + Segel zeichnen
- [x] Bugwellen Partikel (Schaum-Fächer am Bug)
- [x] HUD (Rennen oben rechts, Windkompass unten rechts)
- [x] Windpfeile True + Apparent (Kompass-HUD)

## Phase 5: Polish
- [ ] Startmenü
- [ ] Rennende Screen
- [ ] Highscores (localStorage)
- [ ] Tutorial
- [ ] Sound (optional)

## Nice-to-have
- [ ] Verschiedene Windstärken / Böen
- [ ] Mehrere Boote
- [ ] Kurs-Editor
- [ ] Multiplayer

**Aktueller Fokus**: Phase 5 – Polish

---

**Letztes Update**: 23. Mai 2026 – Phase 4 abgeschlossen
