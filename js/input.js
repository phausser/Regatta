// Keyboard + mouse state
const Input = {
  _held: {},
  _pressed: {},
  _mouseX: 0, _mouseY: 0,
  _clickFrame: false,

  init() {
    window.addEventListener('keydown', e => {
      if (!this._held[e.code]) this._pressed[e.code] = true;
      this._held[e.code] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', e => {
      this._held[e.code] = false;
    });
  },

  initMouse(canvas) {
    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      this._mouseX = e.clientX - r.left;
      this._mouseY = e.clientY - r.top;
    });
    canvas.addEventListener('click', e => {
      const r = canvas.getBoundingClientRect();
      this._mouseX = e.clientX - r.left;
      this._mouseY = e.clientY - r.top;
      this._clickFrame = true;
    });
  },

  mousePos() { return { x: this._mouseX, y: this._mouseY }; },

  isDown(code)    { return !!this._held[code]; },
  isPressed(code) { return !!this._pressed[code]; },
  isClick()       { return this._clickFrame; },

  flush() {
    this._pressed   = {};
    this._clickFrame = false;
  }
};
