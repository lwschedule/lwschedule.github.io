const ANIMATE_CLASS = 'number-flow--animate';

class NumberFlowElement extends HTMLElement {
  constructor() {
    super();
    this._value = '';
    this._animateTimer = null;
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'img');
    }
    if (!this.hasAttribute('aria-live')) {
      this.setAttribute('aria-live', 'polite');
    }

    if (!this.textContent) {
      this.textContent = '--';
    }

    this._value = this.textContent;
    this.setAttribute('aria-label', this._value);
  }

  disconnectedCallback() {
    if (this._animateTimer) {
      clearTimeout(this._animateTimer);
      this._animateTimer = null;
    }
  }

  get value() {
    return this._value;
  }

  set value(nextValue) {
    this.update(nextValue);
  }

  update(nextValue) {
    const nextText = String(nextValue ?? '');
    if (nextText === this._value && this.textContent === nextText) {
      return;
    }

    this._value = nextText;
    this.textContent = nextText;
    this.setAttribute('aria-label', nextText);

    this.classList.remove(ANIMATE_CLASS);
    void this.offsetWidth;
    this.classList.add(ANIMATE_CLASS);

    if (this._animateTimer) {
      clearTimeout(this._animateTimer);
    }

    this._animateTimer = setTimeout(() => {
      this.classList.remove(ANIMATE_CLASS);
      this._animateTimer = null;
    }, 240);
  }
}

class NumberFlowGroupElement extends HTMLElement {
  connectedCallback() {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'group');
    }
  }
}

if (!customElements.get('number-flow')) {
  customElements.define('number-flow', NumberFlowElement);
}

if (!customElements.get('number-flow-group')) {
  customElements.define('number-flow-group', NumberFlowGroupElement);
}

export { NumberFlowElement, NumberFlowGroupElement };