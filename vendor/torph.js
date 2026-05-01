export class TextMorph {
  constructor({ element } = {}) {
    this.element = element || null;
    this.value = this.element ? this.element.textContent.trim() : '';
    this._timer = null;
    
    // Convert to flex container to hold two spans (old and new)
    if (this.element) {
      if (getComputedStyle(this.element).position === 'static') {
        this.element.style.position = 'relative';
      }
      this.element.style.display = 'inline-flex';
      this.element.style.flexDirection = 'column';
      this.element.style.overflow = 'hidden';
      this.element.style.verticalAlign = 'top';
      this.element.style.height = '1em'; // Lock height to 1 line
      this.element.style.lineHeight = '1';
      
      const initialSpan = document.createElement('span');
      initialSpan.textContent = this.value;
      initialSpan.style.display = 'block';
      initialSpan.style.height = '1em';
      initialSpan.style.transition = 'transform 240ms cubic-bezier(0.19, 1, 0.22, 1)';
      
      this.element.innerHTML = '';
      this.element.appendChild(initialSpan);
    }
  }

  update(nextValue) {
    const nextText = nextValue == null ? '' : String(nextValue);
    if (nextText === this.value) {
      return;
    }
    
    this.value = nextText;
    if (!this.element) return;
    
    // Morph logic: we create a new span below, then slide them both up.
    // Clean up existing spans
    const currentSpan = this.element.firstElementChild;
    if (!currentSpan) return;

    const newSpan = document.createElement('span');
    newSpan.textContent = nextText;
    newSpan.style.display = 'block';
    newSpan.style.height = '1em';
    newSpan.style.transition = 'transform 240ms cubic-bezier(0.19, 1, 0.22, 1)';
    newSpan.style.transform = 'translateY(0)';
    
    this.element.appendChild(newSpan);
    
    // Force layout
    void this.element.offsetWidth;
    
    // Slide both up by 1em
    currentSpan.style.transform = 'translateY(-1em)';
    newSpan.style.transform = 'translateY(-1em)';
    
    if (this._timer) clearTimeout(this._timer);
    
    this._timer = setTimeout(() => {
      if (this.element && this.element.firstElementChild === currentSpan) {
        this.element.removeChild(currentSpan);
        // Reset transform of the remaining span to 0 without animation
        newSpan.style.transition = 'none';
        newSpan.style.transform = 'translateY(0)';
      }
      this._timer = null;
    }, 250);
  }
}

if (typeof window !== 'undefined') {
  window.TextMorph = TextMorph;
}
