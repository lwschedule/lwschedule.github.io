// Today's schedule page functionality

function minutesNow() {
    const d = new Date();
    return d.getHours()*60 + d.getMinutes();
  }
  
  function updateTodaySchedule() {
    const scheduleEl = document.getElementById('todayContent');
    if (!scheduleEl) return;
    const schedules = getSchedules(new Date());
    const today = schedules[getDayNameFromDate(new Date())];
    scheduleEl.innerHTML = renderScheduleTable(today, minutesNow(), true);
  }
  
  function initPage() {
    checkSetupComplete();
    loadThemeOnPage();
    loadLunchPreferences();
    updateTodaySchedule();
    setInterval(updateTodaySchedule, 1000);
  }
  
  initPage();