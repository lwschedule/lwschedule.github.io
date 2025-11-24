let lunchPrefs = JSON.parse(localStorage.getItem('lunchPreferences') || '{"Monday":"A","Tuesday":"A","Wednesday":"All","Thursday":"A","Friday":"A"}');

function updateUI() {
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
    localStorage.setItem('lunchPreferences', JSON.stringify(lunchPrefs));
    updateUI();
  });
});

document.getElementById('resetLunchBtn').addEventListener('click', () => {
  if (confirm('Reset all lunch preferences to A Lunch?')) {
    lunchPrefs = {Monday:'A',Tuesday:'A',Wednesday:'All',Thursday:'A',Friday:'A'};
    localStorage.setItem('lunchPreferences', JSON.stringify(lunchPrefs));
    updateUI();
  }
});

updateUI();