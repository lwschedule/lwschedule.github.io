let currentTheme = 'purple';
let gradientMode = 'on';

function applyTheme() {
  document.body.className = `theme-${currentTheme}`;
  if (gradientMode === 'on') {
    document.body.classList.add('gradient-mode');
  }
}

function updateThemeUI() {
  document.querySelectorAll('.themeOption').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.theme === currentTheme);
  });
  document.getElementById('gradientOffBtn').classList.toggle('selected', gradientMode === 'off');
  document.getElementById('gradientOnBtn').classList.toggle('selected', gradientMode === 'on');
}

document.querySelectorAll('.themeOption').forEach(opt => {
  opt.addEventListener('click', () => {
    currentTheme = opt.dataset.theme;
    applyTheme();
    updateThemeUI();
  });
});

document.getElementById('gradientOffBtn').addEventListener('click', () => {
  gradientMode = 'off';
  applyTheme();
  updateThemeUI();
});

document.getElementById('gradientOnBtn').addEventListener('click', () => {
  gradientMode = 'on';
  applyTheme();
  updateThemeUI();
});

let lunchPrefs = {Monday:'A',Tuesday:'A',Wednesday:'All',Thursday:'A',Friday:'A'};

function updateLunchUI() {
  document.querySelectorAll('.lunchBtn[data-day]').forEach(btn => {
    const day = btn.dataset.day;
    const lunch = btn.dataset.lunch;
    btn.classList.toggle('selected', lunchPrefs[day] === lunch);
  });
}

document.querySelectorAll('.lunchBtn[data-day]').forEach(btn => {
  btn.addEventListener('click', () => {
    const day = btn.dataset.day;
    const lunch = btn.dataset.lunch;
    lunchPrefs[day] = lunch;
    updateLunchUI();
  });
});

let packUpTime = 0;

function updatePackUpUI() {
  document.querySelectorAll('.pack-up-preset').forEach(btn => {
    const val = parseInt(btn.dataset.value, 10);
    btn.classList.toggle('selected', val === packUpTime);
  });
}

document.querySelectorAll('.pack-up-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    packUpTime = parseInt(btn.dataset.value, 10);
    updatePackUpUI();
  });
});

document.getElementById('completeBtn').addEventListener('click', () => {
  localStorage.setItem('theme', currentTheme);
  localStorage.setItem('gradient', gradientMode);
  localStorage.setItem('lunchPreferences', JSON.stringify(lunchPrefs));
  localStorage.setItem('pack-up-time', packUpTime);
  localStorage.setItem('setup-complete', 'true');
  window.location.href = '/';
});

applyTheme();
updateThemeUI();
updateLunchUI();
updatePackUpUI();