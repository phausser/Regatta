# GeoSail Regatta – Todo Liste

## Phase 0–5: Abgeschlossen ✓
Basis-Implementierung (Canvas 2D): Physik, Rennstrecke, Sound, Menü, Tutorial, Highscores.

---

## Phase 6: Three.js Foundation ✓
- [x] Three.js r160 via CDN in `index.html` (r168 hat keinen UMD-Build mehr)
- [x] `js/scene.js`: Scene, WebGLRenderer, OrthographicCamera (senkrecht von oben)
- [x] Resize-Handler (Kamera + Renderer)
- [x] `camera.js` entfernt (Logik in scene.js)
- [x] `renderer.js` entfernt
- [x] HUD als `<div id="hud">` HTML-Overlay in `index.html`
- [x] `main.js`: Game-Loop auf `renderer.setAnimationLoop()` umgestellt
- [x] `ui.js`: HUD-Update auf DOM-Elemente umgestellt (kein ctx mehr)
- [x] Koordinaten-Bridge: Physik-Welt (X/Y) → Three.js (X/Z)
- [x] Placeholder-Meshes: Boot (Box), Bojen (Zylinder), Gate, Kurs-Linie

## Phase 7: 3D Wasser ☐
- [ ] `js/waterMesh.js`: `PlaneGeometry(5000, 5000, 128, 128)`
- [ ] GLSL ShaderMaterial: Vertex-Wellen (2–3 überlagerte Sinuswellen)
- [ ] Fragment-Shader: Tiefblau-Basis, Schaum an Wellenkämmen, windabhängige Intensität
- [ ] Wasser-Mesh in Scene einfügen, animiert via `update(dt)`

## Phase 8: 3D Boot & Segel ☐
- [ ] `js/boatMesh.js`: Gruppe (hull + mast + sail + partikel)
- [ ] Rumpf: `ExtrudeGeometry` aus 2D-Bootskontur, ~2 WE Höhe
- [ ] Mast: `CylinderGeometry` (dünn, hoch), weißes Material, Schatten
- [ ] Segel: `BufferGeometry` (3 Verts), jedes Frame neu berechnet (Wölbung = Bezier)
- [ ] Segel-Farbe = Trim-Zustand (creme/gut, orange/overtrimmed, rot/luffing)
- [ ] Bugwellen: `Points`-Partikelsystem (Schaum-Fächer), aus `renderer.js` portiert
- [ ] `boat.js`: `draw()` entfernen, Physik-Daten werden von `boatMesh.js` gelesen

## Phase 9: 3D Bojen & Gate ☐
- [ ] `js/marksMesh.js`: Bojen-Gruppe
- [ ] Kurstonnen: `CylinderGeometry`, gelb, Bob-Animation (sinus auf Y)
- [ ] Gate-Pfosten: schlanke Zylinder, rot/grün
- [ ] `race.js`: `draw()` entfernen, Logik-Daten werden von `marksMesh.js` gelesen

## Phase 10: Arcade-Tuning ☐
- [ ] Wind-Default: 8 kn → 14 kn (`wind.js`)
- [ ] Speed-Faktor: `awSpeed * 1.05` → `* 1.35` (`boat.js`)
- [ ] TURN_RATE: 0.9 → 1.2 (`boat.js`)
- [ ] Kurs kompakter: Gate (2200/2800, 2600), Mark1 (2000,2100), Mark2 (3000,2100), Mark3 (2500,3000)
- [ ] Ziel verifizieren: Rundenzeit 5–8 Minuten

## Phase 11: Licht, Schatten & Polish ☐
- [ ] `DirectionalLight` (Sonne, schräg oben)
- [ ] `AmbientLight` für Fill
- [ ] `PCFSoftShadowMap`: Boot + Bojen werfen Schatten auf Wasser
- [ ] Wind-Kompass: sauberes HTML-Overlay (mini 2D-Canvas)
- [ ] HUD: finales Design (minimalistisch, semitransparent dunkel, heller Text)
- [ ] Startmenü: auf neuen visuellen Stil abstimmen

---

## Backlog
- [ ] Verschiedene Windstärken / Böen
- [ ] Mehrere Boote / KI-Gegner
- [ ] Multiplayer

---

**Aktueller Fokus**: Phase 7 – 3D Wasser
**Branch**: `feature/threejs-visual-overhaul`
**Letztes Update**: 27. Juni 2026
