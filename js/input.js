// Keyboard state – tracks which keys are currently held and which were just pressed
const Input = {
  _held: {},     // keys currently down
  _pressed: {},  // keys that fired this frame (reset each update)

  init() {
    window.addEventListener('keydown', e => {
      if (!this._held[e.code]) this._pressed[e.code] = true;
      this._held[e.code] = true;
      // Prevent arrow keys from scrolling the page
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', e => {
      this._held[e.code] = false;
    });
  },

  // True while the key is held down
  isDown(code) {
    return !!this._held[code];
  },

  // True only on the first frame the key was pressed
  isPressed(code) {
    return !!this._pressed[code];
  },

  // Call once per frame after all input checks
  flush() {
    this._pressed = {};
  }
};
