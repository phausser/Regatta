// Camera – converts between world coordinates and screen coordinates.
// The camera position is the world point shown at the center of the canvas.
const Camera = {
  x: 2500,  // world-space center X
  y: 2500,  // world-space center Y
  zoom: 1,  // pixels per world unit

  // Smoothly move the camera toward a target position
  follow(target, dt) {
    const speed = 5; // higher = snappier
    this.x += (target.x - this.x) * speed * dt;
    this.y += (target.y - this.y) * speed * dt;
  },

  // World → screen
  toScreen(wx, wy, canvas) {
    return {
      x: (wx - this.x) * this.zoom + canvas.width  / 2,
      y: (wy - this.y) * this.zoom + canvas.height / 2
    };
  },

  // Screen → world
  toWorld(sx, sy, canvas) {
    return {
      x: (sx - canvas.width  / 2) / this.zoom + this.x,
      y: (sy - canvas.height / 2) / this.zoom + this.y
    };
  }
};
