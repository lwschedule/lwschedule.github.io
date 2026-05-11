export class TextMorph {
  constructor({ element } = {}) {
    this.element = element || null;
    this.value = this.element ? (this.element.textContent || '') : '';
    this._timer = null;
    this._frame = null;
  }

  update(nextValue) {
    const nextText = String(nextValue == null ? '' : nextValue);

    this.value = nextText;

    if (!this.element) return;

    if (this._frame) {
      if (typeof globalThis.cancelAnimationFrame === 'function') {
        globalThis.cancelAnimationFrame(this._frame);
      } else {
        clearTimeout(this._frame);
      }
      this._frame = null;
    }

    this.element.textContent = nextText;
    this.element.classList.remove('torph--animate');
    // Force a layout/reflow in a way that is reliable across browsers
    // including iOS Safari. Reading getBoundingClientRect() is less
    // likely to be optimized away than the void-offsetWidth trick.
    if (this.element && typeof this.element.getBoundingClientRect === 'function') {
      this.element.getBoundingClientRect();
    }
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }

    const requestFrame = typeof globalThis.requestAnimationFrame === 'function'
      ? globalThis.requestAnimationFrame.bind(globalThis)
      : (callback) => setTimeout(callback, 16);

    this._frame = requestFrame(() => {
      this._frame = null;
      if (this.element) this.element.classList.add('torph--animate');
      this._timer = setTimeout(() => {
        if (this.element) this.element.classList.remove('torph--animate');
        this._timer = null;
      }, 240);
    });
  }
}