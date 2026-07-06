(function () {
  'use strict';

  // ---- CONFIGURATION ------------------------------------------------
  const CONFIG = {
    particleCount: 140,
    trailSpan: 0.38,
    durationMs: 4600,
    rotationDurationMs: 28000,
    pulseDurationMs: 4200,
    strokeWidth: 5.5,
    baseRadius: 7,
    detailAmplitude: 3,
    petalCount: 7,
    curveScale: 3.9,
    fadeOutMs: 300,
    displayDurationMs: 1500,
  };

  const PARTICLE_RADIUS_BASE = 0.9;
  const PARTICLE_RADIUS_RANGE = 2.7;

  // ---- STATE --------------------------------------------------------
  let overlay = null;
  let rafId = null;
  let startedAt = 0;
  let minDurationReached = false;
  let hideRequested = false;

  // ---- MATH HELPERS -------------------------------------------------
  function normalizeProgress(progress) {
    return ((progress % 1) + 1) % 1;
  }

  function getDetailScale(time) {
    const pulseProgress = (time % CONFIG.pulseDurationMs) / CONFIG.pulseDurationMs;
    const pulseAngle = pulseProgress * Math.PI * 2;
    return 0.52 + ((Math.sin(pulseAngle + 0.55) + 1) / 2) * 0.48;
  }

  function getRotation(time) {
    return -((time % CONFIG.rotationDurationMs) / CONFIG.rotationDurationMs) * 360;
  }

  function point(progress, detailScale) {
    const t = progress * Math.PI * 2;
    const petals = Math.round(CONFIG.petalCount);
    const x = CONFIG.baseRadius * Math.cos(t) - CONFIG.detailAmplitude * detailScale * Math.cos(petals * t);
    const y = CONFIG.baseRadius * Math.sin(t) - CONFIG.detailAmplitude * detailScale * Math.sin(petals * t);
    return {
      x: 50 + x * CONFIG.curveScale,
      y: 50 + y * CONFIG.curveScale,
    };
  }

  // ---- SPLASH TEXT ---------------------------------------------------
  const SPLASH_TEXTS = [
    'Building the page',
    'Grabbing files',
    'Downloading data',
    'Optimizing schedule',
  ];

  // ---- BUILD DOM ----------------------------------------------------
  function buildOverlay() {
    const SVG_NS = 'http://www.w3.org/2000/svg';

    overlay = document.createElement('div');
    overlay.id = 'globalLoader';

    // Splash text
    const splash = document.createElement('p');
    splash.id = 'globalLoaderSplash';
    splash.textContent = SPLASH_TEXTS[Math.floor(Math.random() * SPLASH_TEXTS.length)];
    overlay.appendChild(splash);

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('stroke', '#e8e8e8');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('opacity', '0.1');
    path.setAttribute('stroke-width', String(CONFIG.strokeWidth));

    const particles = [];
    const group = document.createElementNS(SVG_NS, 'g');
    group.appendChild(path);
    for (let i = 0; i < CONFIG.particleCount; i++) {
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('fill', '#e8e8e8');
      group.appendChild(circle);
      particles.push(circle);
    }
    svg.appendChild(group);

    overlay.appendChild(svg);
    document.documentElement.appendChild(overlay);

    return { path, particles, group };
  }

  // ---- BUILD PATH STRING --------------------------------------------
  function buildPath(detailScale, steps) {
    steps = steps || 480;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const p = point(i / steps, detailScale);
      d += (i === 0 ? 'M ' : 'L ') + p.x.toFixed(2) + ' ' + p.y.toFixed(2);
    }
    return d;
  }

  // ---- PARTICLE HELPER ----------------------------------------------
  function getParticle(index, progress, detailScale) {
    const tailOffset = index / (CONFIG.particleCount - 1);
    const p = point(normalizeProgress(progress - tailOffset * CONFIG.trailSpan), detailScale);
    const fade = Math.pow(1 - tailOffset, 0.56);
    return {
      x: p.x,
      y: p.y,
      radius: PARTICLE_RADIUS_BASE + fade * PARTICLE_RADIUS_RANGE,
      opacity: 0.04 + fade * 0.96,
    };
  }

  // ---- ANIMATION LOOP -----------------------------------------------
  function startAnimation(path, particles, group) {
    startedAt = performance.now();

    function render(now) {
      const time = now - startedAt;
      const progress = (time % CONFIG.durationMs) / CONFIG.durationMs;
      const detailScale = getDetailScale(time);

      var rotation = 'rotate(' + getRotation(time) + ' 50 50)';
      group.setAttribute('transform', rotation);
      path.setAttribute('d', buildPath(detailScale));

      for (let i = 0; i < CONFIG.particleCount; i++) {
        const p = getParticle(i, progress, detailScale);
        particles[i].setAttribute('cx', p.x.toFixed(2));
        particles[i].setAttribute('cy', p.y.toFixed(2));
        particles[i].setAttribute('r', p.radius.toFixed(2));
        particles[i].setAttribute('opacity', p.opacity.toFixed(3));
      }

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);
  }

  // ---- PERFORM ACTUAL HIDE ------------------------------------------
  function doHide() {
    if (!overlay) return;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    overlay.classList.add('hidden');

    setTimeout(function () {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      overlay = null;
    }, CONFIG.fadeOutMs + 50);
  }

  // ---- TRY HIDE (checks both conditions) ----------------------------
  function tryHide() {
    if (minDurationReached && hideRequested) {
      doHide();
    }
  }

  // ---- PUBLIC API: called by pages when content is ready ------------
  function hideLoader() {
    hideRequested = true;
    tryHide();
  }

  // ---- INIT ---------------------------------------------------------
  const elements = buildOverlay();
  startAnimation(elements.path, elements.particles, elements.group);

  // Mark min duration as reached after displayDurationMs
  setTimeout(function () {
    minDurationReached = true;
    tryHide();
  }, CONFIG.displayDurationMs);

  window.hideLoader = hideLoader;
})();
