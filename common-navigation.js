// Navigation, page transitions, sidebar

function getSidebarIconUrl(iconId) {
  if (typeof iconId !== 'string') return '';
  if (iconId.startsWith('/')) return iconId;
  return `/icons/src/${iconId}.svg`;
}

function renderSfSymbol(symbolName, className = 'sf-symbol-icon') {
  return `<img class="${className}" src="${getSidebarIconUrl(symbolName)}" alt="" aria-hidden="true" decoding="async" loading="lazy">`;
}

const PAGE_TRANSITION_READY_CLASS = 'page-transition-ready';
const PAGE_TRANSITION_EXIT_FORWARD_CLASS = 'page-transition-exit-forward';
const PAGE_TRANSITION_EXIT_BACK_CLASS = 'page-transition-exit-back';
const PAGE_TRANSITION_DURATION_MS = 280;

function getInternalUrl(href) {
  try {
    return new URL(href, window.location.href);
  } catch (e) {
    return null;
  }
}

function isInternalPageUrl(url) {
  return !!url && url.origin === window.location.origin;
}

function clearPageTransitionClasses() {
  if (!document.body) return;
  document.body.classList.remove(PAGE_TRANSITION_EXIT_FORWARD_CLASS, PAGE_TRANSITION_EXIT_BACK_CLASS);
}

function markPageReady() {
  if (!document.body) return;
  clearPageTransitionClasses();
  document.body.classList.add(PAGE_TRANSITION_READY_CLASS);
}

function navigateWithTransition(targetUrl, options = {}) {
  const url = getInternalUrl(targetUrl);
  if (!url || !isInternalPageUrl(url)) {
    window.location.href = targetUrl;
    return;
  }

  if (url.pathname === window.location.pathname && url.search === window.location.search && !url.hash) {
    return;
  }

  if (window.__pageNavigationPending) return;
  window.__pageNavigationPending = true;

  const replace = options.replace === true;

  if (document.body) {
    document.body.classList.remove(PAGE_TRANSITION_READY_CLASS);
    document.body.classList.remove(PAGE_TRANSITION_EXIT_FORWARD_CLASS, PAGE_TRANSITION_EXIT_BACK_CLASS);
    document.body.classList.add(PAGE_TRANSITION_EXIT_FORWARD_CLASS);
  }

  setTimeout(() => {
    if (replace) {
      window.location.replace(targetUrl);
    } else {
      window.location.href = targetUrl;
    }
  }, PAGE_TRANSITION_DURATION_MS);
}

function handlePageTransitionClick(event) {
  const link = event.target.closest('a');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;

  const url = getInternalUrl(href);
  if (!isInternalPageUrl(url)) return;
  if (url.pathname === window.location.pathname && url.search === window.location.search && !url.hash) return;

  event.preventDefault();
  navigateWithTransition(url.href);
}

document.addEventListener('click', handlePageTransitionClick, true);

function enablePageTransitions() {
  if (!document.body) return;
  requestAnimationFrame(markPageReady);
}

if (document.body) {
  enablePageTransitions();
} else {
  document.addEventListener('DOMContentLoaded', enablePageTransitions, { once: true });
}

window.addEventListener('pageshow', () => {
  window.__pageNavigationPending = false;
  markPageReady();
});

// === DATA PROTECTION ===
// Ensures setup is complete and handles redirect-to-setup signals.
// Data is NEVER reset except via:
// 1. User clicks "Reset All Settings" button (calls resetAllSettings)
// 2. Admin activates reset.js trigger (TRIGGER_RESET = true in reset.js)
function checkSetupComplete() {
  let shouldRedirectDueToReset = false;
  try {
    shouldRedirectDueToReset = sessionStorage.getItem('__lws_should_redirect_to_setup') === 'true';
  } catch (e) {}

  const lunch = localStorage.getItem('lunchPreferences');
  const isAlreadyOnSetup = window.location.pathname.includes('/setup');

  if ((!lunch || shouldRedirectDueToReset) && !isAlreadyOnSetup) {
    navigateWithTransition('/setup', { replace: true });
    try { sessionStorage.removeItem('__lws_should_redirect_to_setup'); } catch (e) {}
    return false;
  }
  return true;
}

function injectGlobalSidebar() {
  if (window.location.pathname.startsWith('/setup') || window.location.pathname.startsWith('/app')) return;

  const navLinks = [
    { href: '/', icon: '/icons/src/house.svg', text: 'Home' },
    { href: '/today', icon: '/icons/src/filemenu.and.selection.svg', text: 'Today' },
    { href: '/week', icon: '/icons/src/tablecells.svg', text: 'Week' },
    { href: '/month', icon: '/icons/src/calendar.svg', text: 'Month' },
    { href: '/schedules', icon: '/icons/src/square.fill.text.grid.1x2.svg', text: 'All Schedules' },
    { href: '/events', icon: 'list.bullet.below.rectangle', text: 'Events' },
    { href: '/holidays', icon: 'beach.umbrella', text: 'Holidays' },
    { href: '/quarters', icon: 'rectangle.grid.2x2', text: 'Quarters/Semesters' },
    { href: '#', icon: '/icons/src/map.svg', text: 'Map (Coming Soon)', disabled: true },
    { href: '/info', icon: '/icons/src/info.svg', text: 'Info' },
    { href: '/settings', icon: '/icons/src/gear.svg', text: 'Settings' }
  ];

  let currentPath = window.location.pathname;
  if (currentPath.endsWith('.html') && currentPath !== '/404.html') {
      currentPath = currentPath.replace('/index.html', '');
      if(currentPath === '') currentPath = '/';
  }

  const sidebar = document.createElement('nav');
  sidebar.id = 'globalSidebar';
  
  const mobileToggle = document.createElement('button');
  mobileToggle.id = 'sidebarMobileToggle';
  mobileToggle.innerHTML = renderSfSymbol('line.3.horizontal');
  mobileToggle.setAttribute('aria-label', 'Toggle Menu');
  document.body.appendChild(mobileToggle);

  let linksHtml = '';
  let activeIndex = -1;
  navLinks.forEach((link, index) => {
    let isActive = false;
    if (link.href === '/') {
       isActive = (currentPath === '/' || currentPath === '/index.html');
    } else {
       isActive = currentPath.startsWith(link.href);
    }
    if (isActive && activeIndex === -1) activeIndex = index;
    const iconHtml = link.icon ? renderSfSymbol(link.icon, 'sidebar-icon') : '';

    if (link.disabled) {
      linksHtml += `<div class="sidebar-link disabled" aria-disabled="true">${iconHtml}<span class="sidebar-text">${link.text}</span></div>`;
    } else {
      linksHtml += `<a href="${link.href}" class="sidebar-link ${isActive ? 'active' : ''}" data-index="${index}"${link.disabled ? ' aria-disabled="true" tabindex="-1"' : ''}>${iconHtml}<span class="sidebar-text">${link.text}</span></a>`;
    }
  });

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <img src="/images/logo.png" alt="Logo" class="sidebar-logo">
      <h2 class="sidebar-title">LW Schedule</h2>
    </div>
    <div class="sidebar-links-container">
      <div class="sidebar-bubble" id="sidebarBubble"></div>
      ${linksHtml}
    </div>
  `;
  document.body.appendChild(sidebar);
  document.body.classList.add('has-sidebar');

  const bubble = sidebar.querySelector('#sidebarBubble');
  const linksContainer = sidebar.querySelector('.sidebar-links-container');
  const links = sidebar.querySelectorAll('.sidebar-link');

  function updateBubble(linkEl) {
    let top = 0;
    let left = 0;
    let curr = linkEl;
    while(curr && curr !== linksContainer) {
        top += curr.offsetTop;
        left += curr.offsetLeft;
        curr = curr.offsetParent;
    }
    const rect = linkEl.getBoundingClientRect();
    bubble.style.top = top + 'px';
    bubble.style.height = rect.height + 'px';
    bubble.style.width = rect.width + 'px';
    bubble.style.left = left + 'px';
    bubble.style.opacity = '1';
    bubble.style.borderRadius = linkEl.style.borderRadius || '12px';
  }

  const activeLink = sidebar.querySelector('.sidebar-link.active');
  if (activeLink) {
    bubble.style.transition = 'none';
    setTimeout(() => {
      updateBubble(activeLink);
      requestAnimationFrame(() => {
        bubble.style.transition = '';
      });
    }, 50);
  } else {
    bubble.style.opacity = '0';
  }

  window.addEventListener('resize', () => {
    if (sidebar.querySelector('.sidebar-link.active')) {
      updateBubble(sidebar.querySelector('.sidebar-link.active'));
    }
  });

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const linkUrl = link.getAttribute('href');
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      updateBubble(link);
      
      requestAnimationFrame(() => {
        navigateWithTransition(linkUrl, { direction: link.classList.contains('icon-back-btn') ? 'back' : 'forward' });
      });
    });
  });

  mobileToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    const mask = document.getElementById('sidebarMask') || createMask();
    const isOpen = sidebar.classList.contains('open');
    mask.classList.toggle('show', isOpen);
    mobileToggle.style.opacity = isOpen ? '0' : '1';
    mobileToggle.style.pointerEvents = isOpen ? 'none' : 'auto';
  });

  function createMask() {
    const m = document.createElement('div');
    m.id = 'sidebarMask';
    m.className = 'sidebar-mask';
    document.body.appendChild(m);
    m.addEventListener('click', () => {
      sidebar.classList.remove('open');
      m.classList.remove('show');
      mobileToggle.style.opacity = '1';
      mobileToggle.style.pointerEvents = 'auto';
    });
    return m;
  }
}

function syncMobilePrimaryControl() {
  const hasBackButton = Boolean(document.querySelector('.icon-back-btn'));
  document.body.classList.toggle('has-mobile-back-button', hasBackButton);
}

// Defer sidebar injection to avoid blocking page render
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => { injectGlobalSidebar(); syncMobilePrimaryControl(); }, { timeout: 2000 });
} else {
  setTimeout(() => { injectGlobalSidebar(); syncMobilePrimaryControl(); }, 100);
}

// Watch for DOM changes and keep back button class in sync
if (typeof MutationObserver !== 'undefined') {
  new MutationObserver(syncMobilePrimaryControl).observe(document.body, { childList: true, subtree: true });
}
