// Holidays page functionality

function getLastSchoolDayEndTime(beforeDate) {
    let checkDay = new Date(beforeDate.getFullYear(), beforeDate.getMonth(), beforeDate.getDate());
    checkDay.setDate(checkDay.getDate() - 1);
    checkDay.setHours(23, 59, 59, 999);
    for (let i = 0; i < 365; i++) {
      const dayName = getDayNameFromDate(checkDay);
      const holiday = getHolidayForDate(checkDay);
      if (dayName !== 'Saturday' && dayName !== 'Sunday' && !holiday) {
        const schedules = getSchedules(checkDay);
        const schedule = schedules[dayName];
        if (schedule && schedule.length > 0) {
          const lastPeriod = schedule[schedule.length - 1];
          const endTime = new Date(checkDay);
          endTime.setHours(0, 0, 0, 0);
          endTime.setMinutes(lastPeriod.end);
          return endTime;
        }
      }
      checkDay.setDate(checkDay.getDate() - 1);
    }
    return null;
  }
  
  function updateHolidayTable() {
    const tbody = document.getElementById('holidayTableBody');
    if (!tbody) return;
    const now = new Date();
    const upcomingHolidays = holidays.filter(h => h.date > now);
    if (upcomingHolidays.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No more holidays this school year!</td></tr>';
      return;
    }
    let html = '';
    upcomingHolidays.forEach((holiday, index) => {
      const isNext = index === 0;
      html += `<tr class="${isNext ? 'highlight' : ''}"><td><b>${holiday.name}</b></td><td>${holiday.displayDate}</td></tr>`;
    });
    tbody.innerHTML = html;
  }
  
  function updateHolidayCountdown() {
    const countdownGrid = document.getElementById('holidayCountdownTime');
    const countdownMsg = document.getElementById('holidayCountdownMessage');
    const countdownLabel = document.getElementById('holidayCountdownLabel');
    if (!countdownGrid || !countdownMsg || !countdownLabel) return;
    const now = new Date();
    const upcoming = holidays.find(h => h.date > now);
    if (upcoming) {
      const holidayStartDate = new Date(upcoming.date.getFullYear(), upcoming.date.getMonth(), upcoming.date.getDate());
      const lastSchoolDayEnd = getLastSchoolDayEndTime(holidayStartDate);
      if (lastSchoolDayEnd && lastSchoolDayEnd > now) {
        countdownGrid.style.display = 'grid';
        countdownMsg.style.display = 'none';
        const diff = lastSchoolDayEnd - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        countdownLabel.innerHTML = `UNTIL ${upcoming.name}`;
        updateRollingText(document.getElementById('countdown-days'), days.toString());
        updateRollingText(document.getElementById('countdown-hours'), hours.toString().padStart(2,'0'));
        updateRollingText(document.getElementById('countdown-minutes'), minutes.toString().padStart(2,'0'));
        updateRollingText(document.getElementById('countdown-seconds'), seconds.toString().padStart(2,'0'));
      } else {
        countdownGrid.style.display = 'none';
        countdownMsg.style.display = 'block';
        updateRollingText(countdownMsg, 'Break in Progress');
        countdownLabel.innerHTML = `ENJOY ${upcoming.name}`;
      }
    } else {
      countdownGrid.style.display = 'none';
      countdownMsg.style.display = 'block';
      updateRollingText(countdownMsg, 'End of school year');
      countdownLabel.innerHTML = 'NO UPCOMING HOLIDAYS';
    }
  }
  
  function initPage() {
    checkSetupComplete();
    loadThemeOnPage();
    loadLunchPreferences();
    updateHolidayCountdown();
    updateHolidayTable();
    setInterval(updateHolidayCountdown, 1000);
  }
  
  initPage();