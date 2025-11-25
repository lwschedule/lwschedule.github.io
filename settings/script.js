const resetBtn = document.getElementById('resetBtn');

if (resetBtn) {
  resetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Are you sure you want to reset ALL settings to default? This will reset your theme, lunch preferences, and pack-up reminders.')) {
      localStorage.clear();
      location.href = '/';
    }
  });
}
