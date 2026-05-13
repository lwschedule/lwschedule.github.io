// Calendar rendering, today/week schedule views, schedule table

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

if (currentYear < 2026 || (currentYear === 2026 && currentMonth < 4)) {
  currentMonth = 4;
  currentYear = 2026;
}

function renderCalendarModal(date) {
  const dayName = getDayNameFromDate(date);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const dayNum = date.getDate();
  const schedules = getSchedules(date);
  const todaySchedule = schedules[dayName];
  let html = `<h3>${dayName} ${month} ${dayNum}</h3>`;
  if (!todaySchedule || (Array.isArray(todaySchedule) && todaySchedule.length === 0)) {
    const holiday = getHolidayForDate(date);
    if (holiday) {
      html += `<div class="noSchoolMessage"><h3>${holiday}</h3><p>Enjoy the holiday!</p></div>`;
    } else {
      html += `<div class="noSchoolMessage"><h3>No School</h3><p>Enjoy your day!</p></div>`;
    }
  } else {
    const nowForModal = (date.toDateString() === new Date().toDateString()) ? minutesNow() : null;
    html += renderScheduleTable(todaySchedule, nowForModal, true);
    const clubsHtml = renderClubsForDay(date, true);
    if (clubsHtml) html += clubsHtml;
  }
  return html;
}

function showCalendarModal(date) {
  let modal = document.getElementById('calendarModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'calendarModal';
    modal.className = 'calendar-modal hidden';
    modal.innerHTML = `<div class="modal-content"></div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideCalendarModal();
    });
  }
  const content = modal.querySelector('.modal-content');
  content.innerHTML = renderCalendarModal(date) +
    '<button class="modal-close" aria-label="Close">×</button>';
  const closeBtn = content.querySelector('.modal-close');
  closeBtn.addEventListener('click', hideCalendarModal);
  modal.classList.remove('hidden');
}

function hideCalendarModal() {
  const modal = document.getElementById('calendarModal');
  if (modal) modal.classList.add('hidden');
}

function renderScheduleTable(schedule, now, showDuration = false, activeClub = null) {
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
    return `<div class="noSchoolMessage"><h3>No School</h3><p>Enjoy your day!</p></div>`;
  }
  let html = "<table class='scheduleTable'><thead><tr><th>Period</th><th>Start</th><th>End</th>";
  if (showDuration) html += "<th>Duration</th>";
  html += "</tr></thead><tbody>";
  for (let i = 0; i < schedule.length; i++) {
    const p = schedule[i];
    const duration = p.end - p.start;
    const active = now !== null && now >= p.start && now < p.end && !(activeClub && typeof clubOverlapsPeriod === 'function' && clubOverlapsPeriod(activeClub, p));
    html += `<tr class='${active?"highlight":""}'><td>${getDisplayPeriodName(p.name)}</td><td>${format(p.start)}</td><td>${format(p.end)}</td>`;
    if (showDuration) html += `<td>${formatDuration(duration)}</td>`;
    html += "</tr>";
  }
  html += "</tbody></table>";
  return html;
}

function getClubOverlapSummary(date) {
  const clubs = typeof getClubsForDate === 'function' ? getClubsForDate(date) : [];
  const schedules = getSchedules(date);
  const dayName = getDayNameFromDate(date);
  const daySchedule = schedules[dayName] || [];

  if (!daySchedule.length) {
    return { clubs, overlappingClubs: [], hasOverlap: false };
  }

  const overlappingClubs = clubs.filter(club => daySchedule.some(period => clubOverlapsPeriod(club, period)));
  return { clubs, overlappingClubs, hasOverlap: overlappingClubs.length > 0 };
}

function updateWeekSchedule() {
  const scheduleEl = document.getElementById('weekContent');
  if (!scheduleEl) return;
  let html = `<table class="weekTable"><thead><tr><th>Day</th><th>Schedule</th></tr></thead><tbody>`;
  const now = new Date();
  let currentDayOfWeek = now.getDay();
  const monday = new Date(now);
  let diff = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  if (currentDayOfWeek === 6 || currentDayOfWeek === 0) {
    diff += 7;
  } else {
    const thisFriday = new Date(now);
    thisFriday.setDate(now.getDate() + (5 - currentDayOfWeek));
    const fridayHoliday = getHolidayForDate(thisFriday);
    if (fridayHoliday) {
      diff += 7;
    }
  }
  monday.setDate(now.getDate() + diff);
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const todayName = currentDayName();
  for (let i = 0; i < 5; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dayNameStr = weekDays[i];
    const isToday = (dayNameStr === todayName && dayDate.toDateString() === now.toDateString());
    const holidayName = getHolidayForDate(dayDate);
    let summary = '';
    const clubOverlapInfo = getClubOverlapSummary(dayDate);
    const clubCount = clubOverlapInfo.clubs.length;
    
    if (holidayName) {
      summary = holidayName;
    } else {
      const schedules = getSchedules(dayDate);
      summary = getScheduleSummary(schedules, dayNameStr, false);
      
      if (clubCount > 0 && typeof isClubsEnabled === 'function' && isClubsEnabled()) {
        const overlapMarker = clubOverlapInfo.hasOverlap ? ' ⚠' : '';
        const overlapClass = clubOverlapInfo.hasOverlap ? ' club-overlap' : '';
        summary += ` <span class="club-indicator${overlapClass}">+${clubCount} club${clubCount > 1 ? 's' : ''}${overlapMarker}</span>`;
      }
    }
    html += `<tr class="${isToday ? 'highlight' : ''} clickable-row" data-day="${dayNameStr.toLowerCase()}" data-date="${dayDate.toISOString()}"><td>${dayNameStr}</td><td>${summary}</td></tr>`;
  }
  html += '</tbody></table>';
  scheduleEl.innerHTML = html;
  document.querySelectorAll('.clickable-row').forEach(row => {
    row.addEventListener('click', () => {
      const day = row.dataset.day;
      const date = row.dataset.date;
      if (typeof navigateWithTransition === 'function') {
        navigateWithTransition(`/week/${day}?date=${encodeURIComponent(date)}`);
      }
    });
  });
}

function updateTodaySchedule() {
  const scheduleEl = document.getElementById('todayContent');
  if (!scheduleEl) return;
  const now = new Date();
  const holiday = getHolidayForDate(now);
  if (holiday) {
    scheduleEl.innerHTML = `<div class="noSchoolMessage"><h3>${holiday}</h3><p>Enjoy the holiday!</p></div>`;
    return;
  }
  const schedules = getSchedules(now);
  const today = schedules[currentDayName()];
  const activeClub = typeof getActiveClubForDay === 'function' ? getActiveClubForDay(now) : null;
  let html = renderScheduleTable(today, minutesNow(), true, activeClub);

  if (activeClub && typeof renderClubCountdown === 'function') {
    html += renderClubCountdown(activeClub, activeClub);
  }

  const clubsHtml = typeof renderClubsForDay === 'function' ? renderClubsForDay(now, true) : '';
  if (clubsHtml) {
    html += clubsHtml;
  }
  
  scheduleEl.innerHTML = html;
}

function updateHolidayTable() {
  const tbody = document.getElementById('holidayTableBody');
  if (!tbody) return;
  if (!holidays || holidays.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">Loading holidays...</td></tr>';
    return;
  }
  let html = '';
  holidays.forEach((holiday, index) => {
    const now = new Date();
    const isUpcoming = holiday.date > now;
    const isNext = isUpcoming && holidays.filter(h => h.date > now).indexOf(holiday) === 0;
    html += `<tr class="${isNext ? 'highlight' : ''}"><td><b>${holiday.name}</b></td><td>${holiday.displayDate}</td></tr>`;
  });
  tbody.innerHTML = html;
}

function updateHolidayCountdown() {
  const countdownGrid = document.getElementById('holidayCountdownTime');
  const countdownMsg = document.getElementById('holidayCountdownMessage');
  const countdownLabel = document.getElementById('holidayCountdownLabel');
  if (!countdownGrid || !countdownMsg || !countdownLabel) return;
  const setHolidayCountdownValues = (days, hours, minutes, seconds) => {
    if (window.updateHolidayCountdownMorphs) {
      try {
        window.updateHolidayCountdownMorphs({ days, hours, minutes, seconds });
        return;
      } catch (error) {
        console.warn('Holiday countdown morph update failed, falling back to textContent.', error);
      }
    }

    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minutesEl = document.getElementById('countdown-minutes');
    const secondsEl = document.getElementById('countdown-seconds');
    if (daysEl) daysEl.textContent = days.toString();
    if (hoursEl) hoursEl.textContent = hours.toString().padStart(2,'0');
    if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2,'0');
    if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2,'0');
  };

  const now = new Date();
  const currentHoliday = getHolidayForDate(now);
  if (currentHoliday) {
    
    const nextSchoolStart = getNextSchoolDayStartTime();
    if (nextSchoolStart && nextSchoolStart > now) {
      countdownGrid.style.display = 'grid';
      countdownMsg.style.display = 'none';
      const diff = nextSchoolStart - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      countdownLabel.innerHTML = `UNTIL SCHOOL RESUMES`;
      setHolidayCountdownValues(days, hours, minutes, seconds);
    } else {
      countdownGrid.style.display = 'none';
      countdownMsg.style.display = 'block';
      countdownMsg.textContent = 'School has resumed';
      countdownLabel.innerHTML = `ENJOYED ${currentHoliday}`;
    }
  } else {
    const upcoming = holidays.find(h => h.date > now);
    if (upcoming) {
      let countdownTarget;
      
      const holidayStartDate = new Date(upcoming.date.getFullYear(), upcoming.date.getMonth(), upcoming.date.getDate());
      countdownTarget = getLastSchoolDayEndTime(holidayStartDate);
      
      if (countdownTarget && countdownTarget > now) {
        countdownGrid.style.display = 'grid';
        countdownMsg.style.display = 'none';
        const diff = countdownTarget - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        countdownLabel.innerHTML = `UNTIL ${upcoming.name}`;
        setHolidayCountdownValues(days, hours, minutes, seconds);
      } else {
        countdownGrid.style.display = 'none';
        countdownMsg.style.display = 'block';
        countdownMsg.textContent = 'Break in Progress';
        countdownLabel.innerHTML = `ENJOY ${upcoming.name}`;
      }
      } else {
        countdownGrid.style.display = 'none';
        countdownMsg.style.display = 'block';
        countdownMsg.textContent = 'End of school year';
        countdownLabel.innerHTML = 'NO UPCOMING HOLIDAYS';
      }
  }
}

function renderCalendar() {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  document.getElementById('currentMonthYear').textContent = `${monthNames[currentMonth]} ${currentYear}`;
  const prevBtn = document.getElementById('prevMonth');
  const nextBtn = document.getElementById('nextMonth');
  
  prevBtn.disabled = (currentYear === 2026 && currentMonth === 4);
  nextBtn.disabled = (currentYear === 2026 && currentMonth === 5);
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
    const header = document.createElement('div');
    header.className = 'calendar-day-header';
    header.textContent = day;
    grid.appendChild(header);
  });
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
  const isFirstMonth = (currentYear === 2026 && currentMonth === 4);
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    if (isFirstMonth) {
      const prevMonthDate = new Date(currentYear, currentMonth - 1, day);
      
      if (prevMonthDate.getFullYear() < 2026 || (prevMonthDate.getFullYear() === 2026 && prevMonthDate.getMonth() < 4)) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day';
        emptyCell.style.visibility = 'hidden';
        grid.appendChild(emptyCell);
        continue;
      }
    }
    const cell = createDayCell(day, true, currentMonth - 1, currentYear);
    grid.appendChild(cell);
  }
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    const cell = createDayCell(day, false, currentMonth, currentYear, isToday);
    grid.appendChild(cell);
  }
  const totalCells = firstDay + daysInMonth;
  const remainingCells = 7 - (totalCells % 7);
  if (remainingCells < 7) {
    for (let day = 1; day <= remainingCells; day++) {
      const cell = createDayCell(day, true, currentMonth + 1, currentYear);
      grid.appendChild(cell);
    }
  }

  const dayCells = Array.from(grid.querySelectorAll('.calendar-day'));
  for (let i = 0; i < dayCells.length; i += 7) {
    const week = dayCells.slice(i, i + 7);
    const hasSpecial = week.some(c =>
      !c.classList.contains('other-month') &&
      c.classList.contains('special-schedule')
    );
    if (hasSpecial) {
      week.forEach(c => {
        if (!c.classList.contains('holiday')) {
          c.classList.add('week-special');
        }
      });
    }
  }
}

function createDayCell(day, otherMonth, month, year, isToday = false) {
  const cell = document.createElement('div');
  cell.className = 'calendar-day';
  if (otherMonth) cell.classList.add('other-month');
  if (isToday) cell.classList.add('today');
  const date = new Date(year, month, day);
  
  const scheduleKey = getScheduleKeyForDate(date);
  if (scheduleKey !== 'normal') {
    cell.classList.add('special-schedule');
  }
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNumber = document.createElement('div');
  dayNumber.className = 'day-number';
  dayNumber.textContent = day;
  const isAfterLastDay = (year > 2026) || (year === 2026 && month > 5) || (year === 2026 && month === 5 && day >= 18);
  if (isAfterLastDay) {
    cell.classList.add('holiday');
  } else if (dayName === 'Saturday' || dayName === 'Sunday') {
    cell.classList.add('holiday');
  } else {
    if (getHolidayForDate(date)) {
      cell.classList.add('holiday');
    } else {
      const schedules = getSchedules(date);
      const schedule = schedules[dayName];
      if (!scheduleHasPeriods(schedule)) {
        cell.classList.add('holiday');
      }
    }
  }
  
  
  const clubs = typeof getClubsForDate === 'function' ? getClubsForDate(date) : [];
  if (clubs.length > 0) {
    const clubIndicator = document.createElement('div');
    clubIndicator.className = 'club-indicator';
    clubIndicator.textContent = `${clubs.length} Club${clubs.length > 1 ? 's' : ''}`;
    clubIndicator.style.cssText =
      'font-size: 0.7em; position: absolute; top: 2px; right: 4px; white-space: nowrap;';
    cell.style.position = 'relative';
    cell.appendChild(clubIndicator);
  }
  
  const isNov26 = month === 10 && day === 26 && year === 2025;
  const isJun17 = month === 5 && day === 17 && year === 2026;
  if (isNov26 || isJun17) {
    cell.style.borderColor = '#a94300';
    cell.classList.remove('holiday');
  }
  cell.appendChild(dayNumber);
  
  cell.addEventListener('click', () => {
    if (otherMonth) return;
    showCalendarModal(date);
  });
  return cell;
}

function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  } else if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  
  if (currentYear < 2026 || (currentYear === 2026 && currentMonth < 4)) {
    currentMonth = 4;
    currentYear = 2026;
  }
  if (currentYear > 2026 || (currentYear === 2026 && currentMonth > 5)) {
    currentMonth = 5;
    currentYear = 2026;
  }
  renderCalendar();
}

function updateCalendarSize() {
}
