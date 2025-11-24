let currentTheme = localStorage.getItem('theme') || 'purple';
let gradientMode = localStorage.getItem('gradient') || 'on';

function applyTheme() {
  document.body.className = `theme-${currentTheme}`;
  if (gradientMode === 'on') {
    document.body.classList.add('gradient-mode');
  }
}

function updateUI() {
  document.querySelectorAll('.themeOption').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.theme === currentTheme);
  });
  document.getElementById('gradientOffBtn').classList.toggle('selected', gradientMode === 'off');
  document.getElementById('gradientOnBtn').classList.toggle('selected', gradientMode === 'on');
}

document.querySelectorAll('.themeOption').forEach(opt => {
  opt.addEventListener('click', () => {
    currentTheme = opt.dataset.theme;
    localStorage.setItem('theme', currentTheme);
    applyTheme();
    updateUI();
  });
});

document.getElementById('gradientOffBtn').addEventListener('click', () => {
  gradientMode = 'off';
  localStorage.setItem('gradient', 'off');
  applyTheme();
  updateUI();
});

document.getElementById('gradientOnBtn').addEventListener('click', () => {
  gradientMode = 'on';
  localStorage.setItem('gradient', 'on');
  applyTheme();
  updateUI();
});

document.getElementById('resetThemeBtn').addEventListener('click', () => {
  if (confirm('Reset theme to default (Purple, Animated Gradient)?')) {
    currentTheme = 'purple';
    gradientMode = 'on';
    localStorage.setItem('theme', 'purple');
    localStorage.setItem('gradient', 'on');
    applyTheme();
    updateUI();
  }
});

applyTheme();
updateUI();