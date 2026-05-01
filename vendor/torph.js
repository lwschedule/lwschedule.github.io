export class TextMorph {
  constructor({ element } = {}) {
    this.element = element || null;
    this.value = this.element ? this.element.textContent || '' : '';
    this._timer = null;
  }

  update(nextValue) {
    const nextText = nextValue == null ? '' : String(nextValue);
    if (nextText === this.value && this.element && this.element.textContent === nextText) {
      return;
    }

    this.value = nextText;

    if (!this.element) return;

    this.element.textContent = nextText;
    this.element.classList.remove('torph--animate');
    void this.element.offsetWidth;
    this.element.classList.add('torph--animate');

    if (this._timer) {
      clearTimeout(this._timer);
    }

    this._timer = setTimeout(() => {
      if (this.element) {
        this.element.classList.remove('torph--animate');
      }
      this._timer = null;
    }, 240);
  }
}

if (typeof window !== 'undefined') {
  window.TextMorph = TextMorph;
}