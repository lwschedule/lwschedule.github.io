let lunchPreferences = null;
let holidays = null;
let schedulesData = null;
let academicTerms = null;

function checkSetupComplete() {
  const theme = localStorage.getItem('theme');
  const gradient = localStorage.getItem('gradient');
  const lunch = localStorage.getItem('lunchPreferences');
  const packup = localStorage.getItem('pack-up-time');
  const setupComplete = localStorage.getItem('setup-complete');
  if (!setupComplete && !window.location.pathname.includes('/setup')) {
    if (!theme || !gradient || !lunch || packup === null) {
      window.location.href = '/setup';
      return false;
    }
  }
  return true;
}

function loadLunchPreferences() {
  try {
    const saved = localStorage.getItem('lunchPreferences');
    if (saved) lunchPreferences = JSON.parse(saved);
  } catch (e) {}
}

function isSem1FinalsWeek(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return year === 2026 && month === 0 && day >= 19 && day <= 23;
}

function getSchedules(date) {
  if (!schedulesData) return {};
  const scheduleKey = isSem1FinalsWeek(date) ? 'sem1FinalsWeek' : 'normal';
  const baseSchedule = schedulesData[scheduleKey];
  const today = getDayNameFromDate(date);
  const lunch = lunchPreferences[today] || 'A';
  // For normal schedule, adjust lunch periods based on preference
  if (scheduleKey === 'normal') {
    const adjusted = { ...baseSchedule };
    if (today === 'Monday' || today === 'Tuesday' || today === 'Thursday' || today === 'Friday') {
      if (lunch === 'B') {
        // Swap A and B lunch
        adjusted[today] = adjusted[today].map(p => {
          if (p.name === 'A Lunch') return { ...p, name: 'B Lunch' };
          if (p.name === 'B Lunch') return { ...p, name: 'A Lunch' };
          if (today === 'Monday' && p.name === 'Period 3') {
            return { ...p, start: 11*60, end: 12*60+20 };
          }
          if (today === 'Monday' && p.name === 'Period 3' && lunch === 'B') {
            return { ...p, start: 11*60, end: 12*60+20 };
          }
          // Similar for other days
          return p;
        });
      }
    }
    return adjusted;
  }
  return baseSchedule;
}

function getDayNameFromDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function currentDayName() {
  return getDayNameFromDate(new Date());
}

function getNowParts() {
  const nowDate = new Date();
  return {
    nowDate,
    weekday: getDayNameFromDate(nowDate),
    minutes: nowDate.getHours() * 60 + nowDate.getMinutes(),
    seconds: nowDate.getSeconds()
  };
}

function format(m) {
  let h = Math.floor(m/60);
  const mm = m%60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${mm.toString().padStart(2,'0')} ${ampm}`;
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getHolidayForDate(date) {
  if (!holidays) return null;
  const checkTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  for (const holiday of holidays) {
    const holidayTime = new Date(holiday.date).getTime();
    if (checkTime === holidayTime) return holiday.name;
    if (holiday.name === "Thanksgiving Break") {
      const start = new Date(2025, 10, 27).getTime();
      const end = new Date(2025, 10, 29).getTime();
      if (checkTime >= start && checkTime <= end) return holiday.name;
    }
    if (holiday.name === "Winter Break") {
      const start = new Date(2025, 11, 20).getTime();
      const end = new Date(2026, 0, 4).getTime();
      if (checkTime >= start && checkTime <= end) return holiday.name;
    }
    if (holiday.name === "Mid-Winter Break") {
      const start = new Date(2026, 1, 12).getTime();
      const end = new Date(2026, 1, 16).getTime();
      if (checkTime >= start && checkTime <= end) return holiday.name;
    }
    if (holiday.name === "Spring Break") {
      const start = new Date(2026, 3, 13).getTime();
      const end = new Date(2026, 3, 17).getTime();
      if (checkTime >= start && checkTime <= end) return holiday.name;
    }
  }
  return null;
}

function getScheduleSummary(schedules, dayName) {
  const schedule = schedules[dayName];
  if (!schedule || schedule.length === 0) return 'No School';
  let names = schedule.map(p => p.name);
  names = names.filter(n => n !== "Break" && n !== "Period 4 (Part 2)");
  const simplifiedNames = names.map(n => {
    if (n.startsWith("Period 1")) return "1";
    if (n.startsWith("Period 2")) return "2";
    if (n.startsWith("Period 3")) return "3";
    if (n.startsWith("Period 4")) return "4";
    if (n.startsWith("Period 5")) return "5";
    if (n.startsWith("Period 6")) return "6";
    if (n.includes("Lunch")) return "L";
    if (n.includes("Homeroom")) return "HR";
    return n;
  });
  const uniqueNames = [...new Set(simplifiedNames)];
  return uniqueNames.join(', ');
}

function updateRollingText(element, newText) {
  if (!element) return;
  let oldText = element.dataset.previousText;
  if (!oldText) {
    if (element.querySelector('.digit-roller .new')) {
      oldText = element.querySelector('.digit-roller .new').textContent;
    } else {
      oldText = element.textContent;
    }
    element.dataset.previousText = oldText || '';
  }
  oldText = (oldText || '').trim();
  newText = (newText || '').trim();
  if (oldText === newText) return;
  const newIsNumeric = /^\d+$/.test(newText);
  const oldIsNumeric = /^\d+$/.test(oldText);
  if (newIsNumeric && !oldIsNumeric) {
    oldText = oldText || newText.replace(/./g, '0');
  }
  if (newIsNumeric && /^\d+$/.test(oldText)) {
    let rollerWidth = '100%';
    element.innerHTML = `<span class="digit-roller" style="width: ${rollerWidth}; height: 1em; line-height: 1em;"><span class="old">${oldText}</span><span class="new">${newText}</span></span>`;
    element.dataset.previousText = newText;
    return;
  }
  let html = '';
  let newChars = newText.split('');
  let oldChars = oldText.split('');
  let len = Math.max(newChars.length, oldChars.length);
  for (let i = 0; i < len; i++) {
    let newChar = newChars[i] || '';
    let oldChar = oldChars[i] || '';
    if (newChar === oldChar) {
      html += `<span class="static-char">${newChar}</span>`;
    } else {
      let width = '0.6em';
      if (newChar === ':' || newChar === '.') width = '0.3em';
      if (newChar === ' ') width = '0.2em';
      if (['d', 'h', 'm', 's'].includes(newChar)) width = '0.5em';
      html += `<span class="digit-roller" style="width: ${width}; height: 1em; line-height: 1em;">`;
      html += `<span class="old">${oldChar}</span>`;
      html += `<span class="new">${newChar}</span>`;
      html += `</span>`;
    }
  }
  element.innerHTML = html;
  element.dataset.previousText = newText;
}

function displayTimeBlocks(container, data) {
  const daysEl = document.getElementById('clockDisplay-days');
  const hoursEl = document.getElementById('clockDisplay-hours');
  const minutesEl = document.getElementById('clockDisplay-minutes');
  const secondsEl = document.getElementById('clockDisplay-seconds');
  const daysBlock = document.getElementById('clockDisplay-days-block');
  const hoursBlock = document.getElementById('clockDisplay-hours-block');

  // Show/hide blocks
  if (daysBlock) daysBlock.style.display = (data.days && data.days > 0) ? 'block' : 'none';
  if (hoursBlock) hoursBlock.style.display = (data.hours !== undefined) ? 'block' : 'none';

  // Update text
  if (daysEl) daysEl.textContent = data.days ? data.days.toString().padStart(2,'0') : '00';
  if (hoursEl) hoursEl.textContent = data.hours !== undefined ? data.hours.toString().padStart(2,'0') : '00';
  if (minutesEl) minutesEl.textContent = data.minutes.toString().padStart(2,'0');
  if (secondsEl) secondsEl.textContent = data.seconds.toString().padStart(2,'0');
}

function displayMessage(container, message) {
  container.innerHTML = `<div class="time-block" style="grid-column: 1/-1;"><span class="time-value" style="font-size: 1.5em;">${message}</span></div>`;
}

function getNextSchoolDayStartTime() {
  let nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const dayName = getDayNameFromDate(nextDay);
    const holiday = getHolidayForDate(nextDay);
    if (dayName !== 'Saturday' && dayName !== 'Sunday' && !holiday) {
      const schedules = getSchedules(nextDay);
      const schedule = schedules[dayName];
      if (schedule && schedule.length > 0) {
        const firstPeriod = schedule[0];
        const startTime = new Date(nextDay);
        startTime.setMinutes(firstPeriod.start);
        return startTime;
      }
    }
    nextDay.setDate(nextDay.getDate() + 1);
  }
  return null;
}

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

function getHolidayEndDate(holidayName) {
  if (holidayName === "Thanksgiving Break") return new Date(2025, 10, 29, 23, 59, 59);
  if (holidayName === "Winter Break") return new Date(2026, 0, 4, 23, 59, 59);
  if (holidayName === "Mid-Winter Break") return new Date(2026, 1, 15, 23, 59, 59);
  if (holidayName === "Spring Break") return new Date(2026, 3, 17, 23, 59, 59);
  for (const holiday of holidays) {
    if (holiday.name === holidayName) {
      return new Date(holiday.date.getFullYear(), holiday.date.getMonth(), holiday.date.getDate(), 23, 59, 59);
    }
  }
  return null;
}

function getNextPeriodStart(schedule, now) {
  for (let i = 0; i < schedule.length; i++) {
    if (now < schedule[i].start && schedule[i].name !== "Break") {
      return schedule[i];
    }
  }
  return null;
}

function getCurrentPeriod(schedule, now) {
  for (let i = 0; i < schedule.length; i++) {
    if (now >= schedule[i].start && now < schedule[i].end) {
      return schedule[i];
    }
  }
  return null;
}

function updateTheme() {
  const theme = localStorage.getItem('theme') || 'purple';
  document.body.className = `theme-${theme}`;
}

function updateClock() {
  const { nowDate, weekday, minutes: now, seconds: secs } = getNowParts();
  const clockDisplay = document.getElementById('clockDisplay');
  const clockLabel = document.getElementById('clockLabel');
  const timerEl = document.getElementById('timer');
  if (!clockDisplay || !clockLabel || !timerEl) return;

  const holiday = getHolidayForDate(nowDate);
  if (holiday) {
    const nextSchoolStart = getNextSchoolDayStartTime();
    if (nextSchoolStart && nextSchoolStart > nowDate) {
      const diff = nextSchoolStart - nowDate;
      const totalSeconds = Math.floor(diff / 1000);
      const s = totalSeconds % 60;
      const totalMinutes = Math.floor(totalSeconds / 60);
      const m = totalMinutes % 60;
      const totalHours = Math.floor(totalMinutes / 60);
      const h = totalHours % 24;
      const d = Math.floor(totalHours / 24);

      // Always show all time units for consistency
      displayTimeBlocks(clockDisplay, { days: d, hours: h, minutes: m, seconds: s });
      clockLabel.textContent = `UNTIL SCHOOL RESUMES`;
      const countdown = `${d > 0 ? d + 'd ' : ''}${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
      timerEl.innerHTML = countdown;
      timerEl.classList.remove('hidden');
    } else {
      displayMessage(clockDisplay, 'School has resumed');
      clockLabel.textContent = `${holiday} OVER`;
      timerEl.innerHTML = '00:00:00';
      timerEl.classList.remove('hidden');
    }
    return;
  }

  const schedules = getSchedules(nowDate);
  const today = schedules[weekday];
  if (!today || today.length === 0) {
    clockLabel.textContent = 'NO SCHOOL';
    displayMessage(clockDisplay, 'No school today');
    timerEl.innerHTML = '00:00:00';
    timerEl.classList.remove('hidden');
    return;
  }

  const currentPeriod = getCurrentPeriod(today, now);
  if (currentPeriod) {
    const remainingMinutes = currentPeriod.end - now - 1;
    const remainingSeconds = 59 - secs;
    const totalRemainingSeconds = remainingMinutes * 60 + remainingSeconds;
    const h = Math.floor(totalRemainingSeconds / 3600);
    const m = Math.floor((totalRemainingSeconds % 3600) / 60);
    const s = totalRemainingSeconds % 60;

    clockLabel.textContent = currentPeriod.name.toUpperCase();
    displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });
    const countdown = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    timerEl.innerHTML = countdown;
    timerEl.classList.remove('hidden');
  } else if (now < today[0].start) {
    const firstPeriod = today[0];
    const startTime = new Date(nowDate);
    startTime.setHours(0, firstPeriod.start, 0, 0);
    const diff = startTime.getTime() - nowDate.getTime();
    if (diff > 0) {
      const totalSeconds = Math.floor(diff / 1000);
      const s = totalSeconds % 60;
      const totalMinutes = Math.floor(totalSeconds / 60);
      const m = totalMinutes % 60;
      const h = Math.floor(totalMinutes / 60);

      clockLabel.textContent = 'UNTIL SCHOOL STARTS';
      displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });
      const countdown = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
      timerEl.innerHTML = countdown;
      timerEl.classList.remove('hidden');
    }
  } else if (now > today[today.length - 1].end) {
    const nextSchoolStartTime = getNextSchoolDayStartTime();
    if (nextSchoolStartTime) {
      const diff = nextSchoolStartTime.getTime() - nowDate.getTime();
      if (diff > 0) {
        const totalSeconds = Math.floor(diff / 1000);
        const s = totalSeconds % 60;
        const totalMinutes = Math.floor(totalSeconds / 60);
        const m = totalMinutes % 60;
        const totalHours = Math.floor(totalMinutes / 60);
        const h = totalHours % 24;
        const d = Math.floor(totalHours / 24);

        clockLabel.textContent = 'NEXT SCHOOL DAY';
        displayTimeBlocks(clockDisplay, { days: d, hours: h, minutes: m, seconds: s });
        const countdown = `${d > 0 ? d + 'd ' : ''}${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        timerEl.innerHTML = countdown;
        timerEl.classList.remove('hidden');
      }
    }
  } else {
    const nextPeriod = getNextPeriodStart(today, now);
    if (nextPeriod) {
      const remainingMinutes = nextPeriod.start - now - 1;
      const remainingSeconds = 59 - secs;
      const totalRemainingSeconds = remainingMinutes * 60 + remainingSeconds;
      const h = Math.floor(totalRemainingSeconds / 3600);
      const m = Math.floor((totalRemainingSeconds % 3600) / 60);
      const s = totalRemainingSeconds % 60;

      clockLabel.textContent = `UNTIL ${nextPeriod.name.toUpperCase()}`;
      displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });
      const countdown = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
      timerEl.innerHTML = countdown;
      timerEl.classList.remove('hidden');
    }
  }
}

function minutesNow() {
  const d = new Date();
  return d.getHours()*60 + d.getMinutes();
}

function renderScheduleTable(schedule, now, showDuration = false) {
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
    return `<div class="noSchoolMessage"><h3>No School</h3><p>Enjoy your day!</p></div>`;
  }
  let html = "<table class='scheduleTable'><thead><tr><th>Period</th><th>Start</th><th>End</th>";
  if (showDuration) html += "<th>Duration</th>";
  html += "</tr></thead><tbody>";
  for (let i = 0; i < schedule.length; i++) {
    const p = schedule[i];
    const duration = p.end - p.start;
    const active = now !== null && now >= p.start && now < p.end;
    html += `<tr class='${active?"highlight":""}'><td>${p.name}</td><td>${format(p.start)}</td><td>${format(p.end)}</td>`;
    if (showDuration) html += `<td>${formatDuration(duration)}</td>`;
    html += "</tr>";
  }
  html += "</tbody></table>";
  return html;
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
    if (holidayName) {
      summary = holidayName;
    } else {
      const schedules = getSchedules(dayDate);
      summary = getScheduleSummary(schedules, dayNameStr);
    }
    html += `<tr class="${isToday ? 'highlight' : ''} clickable-row" data-day="${dayNameStr.toLowerCase()}" data-date="${dayDate.toISOString()}"><td>${dayNameStr}</td><td>${summary}</td></tr>`;
  }
  html += '</tbody></table>';
  scheduleEl.innerHTML = html;
  document.querySelectorAll('.clickable-row').forEach(row => {
    row.addEventListener('click', () => {
      const day = row.dataset.day;
      const date = row.dataset.date;
      window.location.href = `/week/${day}?date=${encodeURIComponent(date)}`;
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
  scheduleEl.innerHTML = renderScheduleTable(today, minutesNow(), true);
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
  const now = new Date();
  const currentHoliday = getHolidayForDate(now);
  if (currentHoliday) {
    // During a holiday, count down to the next school day instead of holiday end
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
      const daysEl = document.getElementById('countdown-days');
      const hoursEl = document.getElementById('countdown-hours');
      const minutesEl = document.getElementById('countdown-minutes');
      const secondsEl = document.getElementById('countdown-seconds');
      if (daysEl) daysEl.textContent = days.toString();
      if (hoursEl) hoursEl.textContent = hours.toString().padStart(2,'0');
      if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2,'0');
      if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2,'0');
    } else {
      countdownGrid.style.display = 'none';
      countdownMsg.style.display = 'block';
      countdownMsg.textContent = 'School has resumed';
      countdownLabel.innerHTML = `ENJOYED ${currentHoliday}`;
    }
  } else {
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
        const daysEl = document.getElementById('countdown-days');
        const hoursEl = document.getElementById('countdown-hours');
        const minutesEl = document.getElementById('countdown-minutes');
        const secondsEl = document.getElementById('countdown-seconds');
        if (daysEl) daysEl.textContent = days.toString();
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2,'0');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2,'0');
        if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2,'0');
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
  prevBtn.disabled = (currentYear === 2025 && currentMonth === 11);
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
  const isFirstMonth = (currentYear === 2025 && currentMonth === 11);
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    if (isFirstMonth) {
      const prevMonthDate = new Date(currentYear, currentMonth - 1, day);
      if (prevMonthDate.getFullYear() < 2025 || (prevMonthDate.getFullYear() === 2025 && prevMonthDate.getMonth() < 11)) {
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
}

function createDayCell(day, otherMonth, month, year, isToday = false) {
  const cell = document.createElement('div');
  cell.className = 'calendar-day';
  if (otherMonth) cell.classList.add('other-month');
  if (isToday) cell.classList.add('today');
  const date = new Date(year, month, day);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNumber = document.createElement('div');
  dayNumber.className = 'day-number';
  dayNumber.textContent = day;
  const daySchedule = document.createElement('div');
  daySchedule.className = 'day-schedule';
  const isAfterLastDay = (year > 2026) || (year === 2026 && month > 5) || (year === 2026 && month === 5 && day >= 18);
  if (isAfterLastDay) {
    daySchedule.textContent = '';
    cell.classList.add('holiday');
  } else if (dayName === 'Saturday' || dayName === 'Sunday') {
    daySchedule.textContent = '';
    cell.classList.add('holiday');
  } else {
    const holidayName = getHolidayForDate(date);
    if (holidayName) {
      daySchedule.textContent = '';
      cell.classList.add('holiday');
    } else {
      const schedules = getSchedules(date);
      const schedule = schedules[dayName];
      if (schedule && schedule.length > 0) {
        const summary = getScheduleSummary(schedules, dayName);
        daySchedule.textContent = summary;
      } else {
        daySchedule.textContent = '';
        cell.classList.add('holiday');
      }
    }
  }
  const isNov26 = month === 10 && day === 26 && year === 2025;
  const isJun17 = month === 5 && day === 17 && year === 2026;
  if (isNov26 || isJun17) {
    cell.style.borderColor = '#d35400';
    cell.classList.remove('holiday');
  }
  cell.appendChild(dayNumber);
  cell.appendChild(daySchedule);
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
  // Enforce bounds: November 2025 to June 2026
  if (currentYear < 2025 || (currentYear === 2025 && currentMonth < 11)) {
    currentMonth = 11;
    currentYear = 2025;
  }
  if (currentYear > 2026 || (currentYear === 2026 && currentMonth > 5)) {
    currentMonth = 5;
    currentYear = 2026;
  }
  renderCalendar();
}

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
if (currentYear < 2025 || (currentYear === 2025 && currentMonth < 11)) {
  currentMonth = 11;
  currentYear = 2025;
}

function loadThemeOnPage() {
  const theme = localStorage.getItem('theme') || 'purple';
  document.body.className = `theme-${theme}`;
  const themeColors = {
    purple: '#4b2e83',
    red: '#c41e3a',
    orange: '#d35400',
    yellow: '#c29d00',
    green: '#27ae60',
    blue: '#2980b9',
    indigo: '#3f51b5',
    pink: '#c2185b'
  };
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.content = themeColors[theme] || '#4b2e83';
  }
}

async function loadData() {
  try {
    const [schedulesRes, holidaysRes, termsRes] = await Promise.all([
      fetch('/data/schedules.json'),
      fetch('/data/holidays.json'),
      fetch('/data/terms.json')
    ]);
    if (!schedulesRes.ok || !holidaysRes.ok || !termsRes.ok) {
      throw new Error('Failed to load data files');
    }
    schedulesData = await schedulesRes.json();
    holidays = await holidaysRes.json();
    academicTerms = await termsRes.json();
    // Convert date strings to Date objects for holidays
    holidays = holidays.map(h => ({
      ...h,
      date: new Date(h.date)
    }));
    // Convert date strings to Date objects for academic terms
    academicTerms.quarters = academicTerms.quarters.map(q => ({
      ...q,
      start: new Date(q.start),
      end: new Date(q.end)
    }));
    academicTerms.semesters = academicTerms.semesters.map(s => ({
      ...s,
      start: new Date(s.start),
      end: new Date(s.end)
    }));
    // Set lunchPreferences from data
    lunchPreferences = schedulesData.lunchPreferences;
    loadLunchPreferences(); // Override with localStorage if set
  } catch (error) {
    console.error('Error loading data:', error);
    // Set defaults
    schedulesData = { normal: {}, sem1FinalsWeek: {}, lunchPreferences: { Monday: 'A', Tuesday: 'A', Wednesday: 'All', Thursday: 'A', Friday: 'A' } };
    holidays = [];
    academicTerms = { quarters: [], semesters: [] };
  }
}

async function initApp() {
  await loadData();
  checkSetupComplete();
  loadLunchPreferences();
  loadThemeOnPage();
  if (document.getElementById('holidayCountdown')) {
    updateHolidayCountdown();
    setInterval(updateHolidayCountdown, 1000);
  }
  if (document.getElementById('holidayTableBody')) {
    updateHolidayTable();
  }
}
