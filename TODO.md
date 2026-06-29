# GeoSail Regatta – Todo Liste

## Phase 0–5: Abgeschlossen ✓
Basis-Implementierung (Canvas 2D): Physik, Rennstrecke, Sound, Menü, Tutorial, Highscores.

---

## Phase 6: Canvas-Renderer & HUD ✓
- [x] `scene.js`: Canvas-Renderer, Follow-Kamera und Zoom
- [x] Resize-Handler für Canvas und Kamera
- [x] HUD als `<div id="hud">` HTML-Overlay in `index.html`
- [x] `main.js`: Game-Loop mit `requestAnimationFrame`
- [x] `ui.js`: HUD-Update auf DOM-Elemente umgestellt

## Phase 7: Canvas-Wasser ✓
- [x] `waterMesh.js`: Wasserfläche mit Sonnen-/Schatten-Farbverlauf
- [x] Animierte Dreiecks-Wellen
- [x] Wellen bewegen sich in Richtung des wahren Windes

## Phase 8: Boot & Segel ✓
- [x] `boatMesh.js`: weiße Bootssilhouette ohne Deckdetails
- [x] Segel als gewölbtes Canvas-Polygon
- [x] Bugwellen als subtile weiße Pixel, geschwindigkeitsabhängig
- [x] Formbasierter projizierter Bootsschatten
- [x] `boat.js`: Physik bleibt getrennt vom Rendering

## Phase 9: Bojen, Gate & Kursindikatoren ✓
- [x] `marksMesh.js`: Bojen, Gate und Kurslinien
- [x] Kurstonnen bleiben gelb und ändern bei Aktivität nicht die Farbe
- [x] Gate-Pfosten rot/grün
- [x] Projizierte Schatten für Bojen und Gate
- [x] Kursindikatoren als Dreiecke 100 px um das Boot: Gate weiß, Bojen gelb, inaktiv 25 % Alpha

## Phase 10: Arcade-Tuning ✓
- [x] Wind-Default: 8 kn → 14 kn (`wind.js`)
- [x] Speed-Faktor: `awSpeed * 1.05` → `* 1.35` (`boat.js`)
- [x] TURN_RATE: 0.9 → 1.2 (`boat.js`)
- [x] Kurs kompakter: Gate (2200/2800, 2600), Mark1 (2000,2100), Mark2 (3000,2100), Mark3 (2500,3000)
- [x] Ziel verifizieren: Rundenzeit 5–8 Minuten

## Phase 11: Schatten & Polish ✓
- [x] `Scene.sun`: Sonnenposition und Sonnenhöhe
- [x] Schattenlänge aus Objekthöhe und Sonnenhöhe
- [x] Schattenfläche aus äußerer Hülle von Objektkontur + projizierter Kontur
- [x] Schattenverlauf: am Objekt dunkler, Ende Alpha 0
- [x] Wind-Kompass: 50 % Alpha, blau/rot, Pfeile zeigen woher der Wind kommt
- [x] HUD: finales Design (minimalistisch, semitransparent dunkel, heller Text)
- [x] Startmenü: auf neuen visuellen Stil abstimmen

## Phase 12: Rückbau & Abgleich ✓
- [x] Three.js-CDN aus `index.html` entfernt
- [x] Keine Three.js-Runtime-Referenzen in `index.html` und `js/`
- [x] README, SPEC, TODO, AGENTS auf Canvas-Stand aktualisiert

## Phase 13: Server-Highscores ✓
- [x] `server/app.py`: Flask-Highscore-Server mit SQLite
- [x] `GET /health` Healthcheck
- [x] CORS für lokale Entwicklungs-Origins
- [x] Browser-Signatur aus normalen Request-Headern
- [x] Session-Timeout und Cleanup
- [x] Zeit-Plausibilität: 3 min < Zeit < 60 min
- [x] Eingereichte Zeit muss mindestens der Session-Laufzeit entsprechen
- [x] `js/scoreApi.js`: Client-API für Session, Submit und Leaderboard
- [x] `ui.js`: Startmenü und Finish-Overlay zeigen Server-Bestzeiten
- [x] localStorage-Highscores entfernt

---

## Backlog
- [ ] Verschiedene Windstärken / Böen
- [ ] Mehrere Boote / KI-Gegner
- [ ] Multiplayer
- [ ] Spielernamen-Eingabe für Server-Highscores

---

**Aktueller Fokus**: Server-Highscores abgeschlossen
**Branch**: `add-highscores`
**Letztes Update**: 29. Juni 2026
