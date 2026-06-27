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

## Phase 7: 3D Wasser ✓
- [x] `js/waterMesh.js`: `PlaneGeometry(12000, 12000, 128, 128)`
- [x] GLSL ShaderMaterial: Vertex-Wellen (3 überlagerte Sinuswellen)
- [x] Fragment-Shader: Tiefblau-Basis, Schaum an Wellenkämmen, windabhängige Intensität
- [x] Wasser-Mesh in Scene einfügen, animiert via `update(dt)`

## Phase 8: 3D Boot & Segel ✓
- [x] `js/boatMesh.js`: Gruppe (hull + mast + sail + partikel)
- [x] Rumpf: `ExtrudeGeometry` aus 2D-Bootskontur, ~2 WE Höhe
- [x] Mast: `CylinderGeometry` (dünn, hoch), weißes Material
- [x] Segel: `BufferGeometry` (3 Verts), jedes Frame neu berechnet (Wölbung = Bezier-Annäherung)
- [x] Segel-Farbe = Trim-Zustand (creme/gut, orange/overtrimmed, rot/luffing)
- [x] Bugwellen: `Points`-Partikelsystem (Schaum-Fächer)
- [x] `boat.js`: `draw()` entfernt

## Phase 9: 3D Bojen & Gate ✓
- [x] `js/marksMesh.js`: Bojen-Gruppe
- [x] Kurstonnen: `CylinderGeometry`, gelb, Bob-Animation (sinus auf Y)
- [x] Gate-Pfosten: schlanke Zylinder, rot/grün
- [x] `race.js`: `draw()` entfernen, Logik-Daten werden von `marksMesh.js` gelesen

## Phase 10: Arcade-Tuning ✓
- [x] Wind-Default: 8 kn → 14 kn (`wind.js`)
- [x] Speed-Faktor: `awSpeed * 1.05` → `* 1.35` (`boat.js`)
- [x] TURN_RATE: 0.9 → 1.2 (`boat.js`)
- [x] Kurs kompakter: Gate (2200/2800, 2600), Mark1 (2000,2100), Mark2 (3000,2100), Mark3 (2500,3000)
- [x] Ziel verifizieren: Rundenzeit 5–8 Minuten

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

**Aktueller Fokus**: Phase 11 – Licht, Schatten & Polish
**Branch**: `feature/threejs-visual-overhaul`
**Letztes Update**: 27. Juni 2026
