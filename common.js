let lunchPreferences = null;
let pilot3LunchPreferences = null;
let sbaLunchPreferences = null;
let holidays = null;
let schedulesData = null;
let academicTerms = null;
let clubsData = null;

const MAX_CLASS_SLOTS = 6;

function normalizeClassSlots(rawSlots) {
  const slots = Array(MAX_CLASS_SLOTS).fill('');
  if (!Array.isArray(rawSlots)) return slots;

  const used = new Set();
  for (let i = 0; i < MAX_CLASS_SLOTS; i++) {
    const value = typeof rawSlots[i] === 'string' ? rawSlots[i].trim() : '';
    if (!value || used.has(value)) continue;
    used.add(value);
    slots[i] = value;
  }

  return slots;
}

function isClassesEnabled() {
  return localStorage.getItem('classesEnabled') !== 'false';
}

function setClassesEnabled(enabled) {
  localStorage.setItem('classesEnabled', enabled ? 'true' : 'false');
}

function getSelectedClassesSlots() {
  try {
    const saved = localStorage.getItem('selectedClasses');
    return normalizeClassSlots(saved ? JSON.parse(saved) : []);
  } catch (e) {
    return Array(MAX_CLASS_SLOTS).fill('');
  }
}

function getSelectedClasses() {
  return getSelectedClassesSlots().filter(Boolean);
}

function setSelectedClassesSlots(slots) {
  const normalized = normalizeClassSlots(slots);
  localStorage.setItem('selectedClasses', JSON.stringify(normalized));
  return normalized;
}

function getPeriodNumberFromName(periodName) {
  if (typeof periodName !== 'string') return null;
  const match = periodName.match(/^Period\s+([1-6])\b/i);
  return match ? parseInt(match[1], 10) : null;
}

function getClassTitleForPeriod(periodName) {
  if (!isClassesEnabled()) return '';
  const periodNumber = getPeriodNumberFromName(periodName);
  if (!periodNumber) return '';
  const slots = getSelectedClassesSlots();
  return slots[periodNumber - 1] || '';
}

function getDisplayPeriodName(periodName) {
  const classTitle = getClassTitleForPeriod(periodName);
  return classTitle || periodName;
}

function getScheduleSummaryLabel(periodName, useClassTitles = true) {
  const periodNumber = getPeriodNumberFromName(periodName);
  if (periodNumber) {
    if (!useClassTitles) return periodNumber.toString();
    const classTitle = getClassTitleForPeriod(periodName);
    return classTitle || periodNumber.toString();
  }

  const lowerName = periodName.toLowerCase();
  if (lowerName.includes('lunch')) return 'L';
  if (lowerName.includes('homeroom')) return 'HR';
  if (lowerName.includes('roo')) return 'Roo';
  return periodName;
}

function checkSetupComplete() {
  const theme = localStorage.getItem('theme');
  const gradient = localStorage.getItem('gradient');
  const lunch = localStorage.getItem('lunchPreferences');
  const packup = localStorage.getItem('pack-up-time');
  const setupComplete = localStorage.getItem('setup-complete');
  const appVisited = localStorage.getItem('app-visited');
  
  
  const isInPWA = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || 
                  (window.navigator.standalone === true);
  
  
  if (!appVisited && !isInPWA && !window.location.pathname.includes('/app') && !window.location.pathname.includes('/setup')) {
    if (!theme || !gradient || !lunch || packup === null) {
      window.location.href = '/app';
      return false;
    }
  }
  
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
    const pilot3Saved = localStorage.getItem('pilot3LunchPreferences');
    if (pilot3Saved) pilot3LunchPreferences = JSON.parse(pilot3Saved);
    const sbaSaved = localStorage.getItem('sbaLunchPreferences');
    if (sbaSaved) sbaLunchPreferences = JSON.parse(sbaSaved);
  } catch (e) {}
}

function isPilot3Day(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  // Pilot 3 is active March 30–April 3, 2026
  if (year === 2026 && month === 2 && day >= 30 && day <= 31) return true;
  if (year === 2026 && month === 3 && day >= 1 && day <= 3) return true;
  return false;
}

function isSBADay(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  // SBA schedule is active April 6–10, 2026
  if (year === 2026 && month === 3 && day >= 6 && day <= 10) return true;
  return false;
}

function getLunchForScheduleDay(scheduleKey, today, baseScheduleDay) {
  let lunchPrefs = lunchPreferences || { Monday: 'A', Tuesday: 'A', Wednesday: 'All', Thursday: 'A', Friday: 'A' };
  
  if (baseScheduleDay && baseScheduleDay.A && baseScheduleDay.B) {
    const aSchedule = baseScheduleDay.A;
    const aLunchIndex = aSchedule.findIndex(p => p.name.toLowerCase().includes('a lunch') || p.name.toLowerCase().includes('lunch'));
    if (aLunchIndex !== -1) {
      let basePeriod = null;
      for (let i = aLunchIndex + 1; i < aSchedule.length; i++) {
        const match = aSchedule[i].name.match(/Period\s+(\d)/i);
        if (match) {
          basePeriod = match[1];
          break;
        }
      }
      const prefs = lunchPreferences || { Monday: 'A', Tuesday: 'A', Wednesday: 'All', Thursday: 'A', Friday: 'A' };
      if (basePeriod === '3') return prefs.Monday || 'A';
      if (basePeriod === '4') return prefs.Tuesday || 'A';
    }
  }
  
  // Fallback to normal day mapping if detection fails
  if (scheduleKey === 'normal') {
    return lunchPrefs[today] || 'A';
  }
  return 'A'; // All non-standard ones default to A if undocumented
}

function getSchedules(date) {
  if (!schedulesData) return {};
  let scheduleKey = 'normal';
  if (isPilot3Day(date)) scheduleKey = 'pilot3';
  else if (isSBADay(date)) scheduleKey = 'sba';
  const baseSchedule = schedulesData[scheduleKey];
  const today = getDayNameFromDate(date);
  
  const lunch = getLunchForScheduleDay(scheduleKey, today, baseSchedule[today]);

  
  if (scheduleKey === 'normal') {
    const adjusted = { ...baseSchedule };
    
    if (today === 'Monday' || today === 'Tuesday' || today === 'Thursday' || today === 'Friday') {
      if (baseSchedule[today][lunch]) {
        adjusted[today] = baseSchedule[today][lunch];
      }
    }
    return adjusted;
  }
  if (scheduleKey === 'pilot3') {
    const adjusted = { ...baseSchedule };
    if (baseSchedule[today] && baseSchedule[today][lunch]) {
      adjusted[today] = baseSchedule[today][lunch];
    }
    return adjusted;
  }
  if (scheduleKey === 'sba') {
    const adjusted = { ...baseSchedule };
    if (baseSchedule[today] && !Array.isArray(baseSchedule[today]) && baseSchedule[today][lunch]) {
      adjusted[today] = baseSchedule[today][lunch];
    }
    return adjusted;
  }
  return baseSchedule;
}



function getScheduleKeyForDate(date) {
  if (!schedulesData) return 'normal';
  if (isPilot3Day(date)) return 'pilot3';
  if (isSBADay(date)) return 'sba';
  return 'normal';
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
    html += renderScheduleTable(todaySchedule, null, true);
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
    
    if (holiday.name === "Spring Break") {
      const start = new Date(2026, 3, 13).getTime();
      const end = new Date(2026, 3, 17).getTime();
      if (checkTime >= start && checkTime <= end) return holiday.name;
    }
  }
  return null;
}

function getScheduleSummary(schedules, dayName, useClassTitles = true) {
  const schedule = schedules[dayName];
  if (!schedule || schedule.length === 0) return 'No School';

  
  let periodsToProcess = [];
  if (Array.isArray(schedule)) {
    periodsToProcess = schedule;
  } else if (typeof schedule === 'object' && schedule.A) {
    
    periodsToProcess = schedule.A;
  }

  let names = periodsToProcess.map(p => p.name);
  names = names.filter(n => n !== "Break" && n !== "Period 4 (Part 2)");
  const simplifiedNames = names.map(n => getScheduleSummaryLabel(n, useClassTitles));
  const uniqueNames = [...new Set(simplifiedNames)];
  return uniqueNames.join(', ');
}

function scheduleHasPeriods(schedule) {
  if (!schedule) return false;
  if (Array.isArray(schedule)) return schedule.length > 0;
  if (typeof schedule === 'object') {
    for (const key of Object.keys(schedule)) {
      const val = schedule[key];
      if (Array.isArray(val) && val.length > 0) return true;
    }
  }
  return false;
}

function getFirstPeriodFromSchedule(schedule) {
  if (!schedule) return null;
  if (Array.isArray(schedule) && schedule.length > 0) return schedule[0];
  if (typeof schedule === 'object') {
    // prefer A then B then any key
    if (Array.isArray(schedule.A) && schedule.A.length > 0) return schedule.A[0];
    if (Array.isArray(schedule.B) && schedule.B.length > 0) return schedule.B[0];
    const keys = Object.keys(schedule);
    for (const k of keys) {
      if (Array.isArray(schedule[k]) && schedule[k].length > 0) return schedule[k][0];
    }
  }
  return null;
}

function getLastPeriodFromSchedule(schedule) {
  if (!schedule) return null;
  if (Array.isArray(schedule) && schedule.length > 0) return schedule[schedule.length - 1];
  if (typeof schedule === 'object') {
    if (Array.isArray(schedule.B) && schedule.B.length > 0) return schedule.B[schedule.B.length - 1];
    if (Array.isArray(schedule.A) && schedule.A.length > 0) return schedule.A[schedule.A.length - 1];
    const keys = Object.keys(schedule);
    for (const k of keys.reverse ? keys.reverse() : keys) {
      if (Array.isArray(schedule[k]) && schedule[k].length > 0) return schedule[k][schedule[k].length - 1];
    }
  }
  return null;
}

function displayTimeBlocks(container, data) {
  const daysEl = document.getElementById('clockDisplay-days');
  const hoursEl = document.getElementById('clockDisplay-hours');
  const minutesEl = document.getElementById('clockDisplay-minutes');
  const secondsEl = document.getElementById('clockDisplay-seconds');
  const daysBlock = document.getElementById('clockDisplay-days-block');
  const hoursBlock = document.getElementById('clockDisplay-hours-block');

  
  const showDays = (data.days && data.days > 0);
  const showHours = (data.hours !== undefined && (showDays || data.hours > 0));

  if (daysBlock) daysBlock.style.display = showDays ? 'block' : 'none';
  if (hoursBlock) hoursBlock.style.display = showHours ? 'block' : 'none';

  
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
      if (scheduleHasPeriods(schedule)) {
        const firstPeriod = getFirstPeriodFromSchedule(schedule);
        if (firstPeriod) {
          const startTime = new Date(nextDay);
          startTime.setMinutes(firstPeriod.start);
          return startTime;
        }
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
      if (scheduleHasPeriods(schedule)) {
        const lastPeriod = getLastPeriodFromSchedule(schedule);
        if (lastPeriod) {
          const endTime = new Date(checkDay);
          endTime.setHours(0, 0, 0, 0);
          endTime.setMinutes(lastPeriod.end);
          return endTime;
        }
      }
    }
    checkDay.setDate(checkDay.getDate() - 1);
  }
  return null;
}

function getHolidayEndDate(holidayName) {
  if (holidayName === "Thanksgiving Break") return new Date(2025, 10, 29, 23, 59, 59);
  
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

function getNextSchoolDayInfo() {
  const nextSchoolStart = getNextSchoolDayStartTime();
  if (nextSchoolStart) {
    const nextDay = new Date(nextSchoolStart);
    const dayName = getDayNameFromDate(nextDay);
    const month = nextDay.toLocaleDateString('en-US', { month: 'short' });
    const day = nextDay.getDate();
    const schedules = getSchedules(nextDay);
      const schedule = schedules[dayName];
      if (scheduleHasPeriods(schedule)) {
        const first = getFirstPeriodFromSchedule(schedule);
        if (first) return `Next: ${dayName} ${month} ${day} - ${getDisplayPeriodName(first.name)}`;
      }
  }
  return 'Next: School';
}

function getNextPeriodInfo(schedule, now, nowDate) {
  
  const currentPeriod = getCurrentPeriod(schedule, now);
  if (currentPeriod) {
    const next = getNextPeriodStart(schedule, now);
    if (next) return `Next: ${getDisplayPeriodName(next.name)}`;
    
    return getNextSchoolDayInfo();
  }
  
  
  if (now < schedule[0].start) {
    return `Next: ${getDisplayPeriodName(schedule[0].name)}`;
  }
  
  
  const next = getNextPeriodStart(schedule, now);
  if (next) return `Next: ${getDisplayPeriodName(next.name)}`;
  
  
  return getNextSchoolDayInfo();
}

function getNextPeriodInfoForHoliday(nowDate) {
  const nextSchoolStart = getNextSchoolDayStartTime();
  if (nextSchoolStart) {
    const nextDay = new Date(nextSchoolStart);
    const dayName = getDayNameFromDate(nextDay);
    const month = nextDay.toLocaleDateString('en-US', { month: 'short' });
    const day = nextDay.getDate();
    const schedules = getSchedules(nextDay);
      const schedule = schedules[dayName];
      if (scheduleHasPeriods(schedule)) {
        const first = getFirstPeriodFromSchedule(schedule);
        if (first) return `Next: ${dayName} ${month} ${day} - ${getDisplayPeriodName(first.name)}`;
      }
  }
  return 'Next: School';
}

function getCurrentPeriod(schedule, now) {
  for (let i = 0; i < schedule.length; i++) {
    if (now >= schedule[i].start && now < schedule[i].end) {
      return schedule[i];
    }
  }
  return null;
}

function applyThemeClass(theme) {
  const existingThemeClasses = Array.from(document.body.classList).filter(className => className.startsWith('theme-'));
  if (existingThemeClasses.length) {
    document.body.classList.remove(...existingThemeClasses);
  }
  document.body.classList.add(`theme-${theme}`);
}

function updateTheme() {
  const theme = localStorage.getItem('theme') || 'purple';
  applyThemeClass(theme);
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

      
      displayTimeBlocks(clockDisplay, { days: d, hours: h, minutes: m, seconds: s });
      clockLabel.textContent = `UNTIL SCHOOL RESUMES`;
      
      timerEl.innerHTML = getNextPeriodInfoForHoliday(nowDate);
      timerEl.classList.remove('hidden');
    }
    return;
  }

  const schedules = getSchedules(nowDate);
  const today = schedules[weekday];
  if (!today || today.length === 0) {
    
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
        
        timerEl.innerHTML = getNextPeriodInfoForHoliday(nowDate);
        timerEl.classList.remove('hidden');
      }
    }
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

    clockLabel.textContent = getDisplayPeriodName(currentPeriod.name).toUpperCase();
    displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });
    
    timerEl.innerHTML = getNextPeriodInfo(today, now, nowDate);
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
      
      timerEl.innerHTML = getNextPeriodInfo(today, now, nowDate);
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
        
        timerEl.innerHTML = getNextPeriodInfoForHoliday(nowDate);
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

      clockLabel.textContent = `UNTIL ${getDisplayPeriodName(nextPeriod.name).toUpperCase()}`;
      displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });
      
      timerEl.innerHTML = getNextPeriodInfo(today, now, nowDate);
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
    html += `<tr class='${active?"highlight":""}'><td>${getDisplayPeriodName(p.name)}</td><td>${format(p.start)}</td><td>${format(p.end)}</td>`;
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
    
    
    const clubs = getClubsForDate(dayDate);
    const clubCount = clubs.length;
    
    if (holidayName) {
      summary = holidayName;
    } else {
      const schedules = getSchedules(dayDate);
      summary = getScheduleSummary(schedules, dayNameStr, false);
      
      if (clubCount > 0 && isClubsEnabled()) {
        summary += ` <span class="club-indicator">+${clubCount} club${clubCount > 1 ? 's' : ''}</span>`;
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
  let html = renderScheduleTable(today, minutesNow(), true);
  
  
  const clubsHtml = renderClubsForDay(now, true);
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
  
  prevBtn.disabled = (currentYear === 2026 && currentMonth === 3);
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
  const isFirstMonth = (currentYear === 2026 && currentMonth === 3);
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    if (isFirstMonth) {
      const prevMonthDate = new Date(currentYear, currentMonth - 1, day);
      
      if (prevMonthDate.getFullYear() < 2026 || (prevMonthDate.getFullYear() === 2026 && prevMonthDate.getMonth() < 3)) {
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
  
  
  const clubs = getClubsForDate(date);
  if (clubs.length > 0) {
    // show a textual indicator instead of the previous emoji dot.  the
    // user requested "1 Club" / "2 Clubs" rather than a target emoji on
    // the monthly view.
    const clubIndicator = document.createElement('div');
    clubIndicator.className = 'club-indicator';
    clubIndicator.textContent = `${clubs.length} Club${clubs.length > 1 ? 's' : ''}`;
    // keep the positioning similar to the old dot so it floats over the
    // top-right corner of the cell; ensure the text doesn't wrap.
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
  
  if (currentYear < 2026 || (currentYear === 2026 && currentMonth < 3)) {
    currentMonth = 3;
    currentYear = 2026;
  }
  if (currentYear > 2026 || (currentYear === 2026 && currentMonth > 5)) {
    currentMonth = 5;
    currentYear = 2026;
  }
  renderCalendar();
}

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

if (currentYear < 2026 || (currentYear === 2026 && currentMonth < 3)) {
  currentMonth = 3;
  currentYear = 2026;
}

// sizing now handled entirely in CSS with min(100vw,100vh) so
// updateCalendarSize is no longer needed.
function updateCalendarSize() {
  // intentionally empty
}

function loadThemeOnPage() {
  const theme = localStorage.getItem('theme') || 'purple';
  applyThemeClass(theme);
  const themeColors = {
    purple: '#3c2569',
    red: '#9d182e',
    orange: '#a94300',
    yellow: '#9b7e00',
    green: '#1f8b4d',
    blue: '#216694',
    indigo: '#324191',
    pink: '#9b1349'
  };
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.content = themeColors[theme] || '#3c2569';
  }
}



async function loadData() {
  try {
    const [schedulesRes, holidaysRes, termsRes, clubsRes] = await Promise.all([
      fetch('/data/schedules.json'),
      fetch('/data/holidays.json'),
      fetch('/data/terms.json'),
      fetch('/data/clubs.json')
    ]);
    if (!schedulesRes.ok || !holidaysRes.ok || !termsRes.ok) {
      throw new Error('Failed to load data files');
    }
    schedulesData = await schedulesRes.json();
    holidays = await holidaysRes.json();
    academicTerms = await termsRes.json();
    
    holidays = holidays.map(h => ({
      ...h,
      date: new Date(h.date)
    }));
    
    academicTerms.quarters = academicTerms.quarters.map(q => {
      const [startYear, startMonth, startDay] = q.start.split('-').map(Number);
      const [endYear, endMonth, endDay] = q.end.split('-').map(Number);
      return {
        ...q,
        start: new Date(startYear, startMonth - 1, startDay),
        end: new Date(endYear, endMonth - 1, endDay)
      };
    });
    academicTerms.semesters = academicTerms.semesters.map(s => {
      const [startYear, startMonth, startDay] = s.start.split('-').map(Number);
      const [endYear, endMonth, endDay] = s.end.split('-').map(Number);
      return {
        ...s,
        start: new Date(startYear, startMonth - 1, startDay),
        end: new Date(endYear, endMonth - 1, endDay)
      };
    });
    
    lunchPreferences = schedulesData.lunchPreferences;
    loadLunchPreferences(); 
    
    
    if (clubsRes.ok) {
      clubsData = await clubsRes.json();
    }
  } catch (error) {
    console.error('Error loading data:', error);
    
    schedulesData = { normal: {}, finals: {}, lunchPreferences: { Monday: 'A', Tuesday: 'A', Wednesday: 'All', Thursday: 'A', Friday: 'A' } };
    holidays = [];
    academicTerms = { quarters: [], semesters: [] };
    clubsData = { clubs: [] };
  }
}


function isClubsEnabled() {
  return localStorage.getItem('clubsEnabled') !== 'false';
}

function getSelectedClubs() {
  try {
    const saved = localStorage.getItem('selectedClubs');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function isLastWeekdayOfMonth(date, dayName) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  
  const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
  const targetDay = dayMap[dayName];
  
  
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  
  
  for (let d = lastDayOfMonth; d > 0; d--) {
    const checkDate = new Date(year, month, d);
    if (checkDate.getDay() === targetDay) {
      return d === day;
    }
  }
  return false;
}

function isFirstWeekdayOfMonth(date, dayName) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
  const targetDay = dayMap[dayName];
  
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const checkDate = new Date(year, month, d);
    if (checkDate.getDay() === targetDay) {
      return d === day;
    }
  }
  return false;
}

function isEvenWeek(date) {
  
  const schoolStart = new Date(2025, 8, 3); 
  const diffTime = date.getTime() - schoolStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNum = Math.floor(diffDays / 7);
  return weekNum % 2 === 0;
}

function doesClubMeetOnDate(club, date) {
  const dayName = getDayNameFromDate(date);
  
  
  const clubDays = club.days || (club.day ? [club.day] : []);
  if (!clubDays.includes(dayName)) return false;
  
  
  const schoolEnd = new Date(2026, 5, 18); 
  if (date >= schoolEnd) return false;
  
  
  switch (club.frequency) {
    case 'weekly':
      return true;
    case 'every-other':
    case 'biweekly':
      
      return isEvenWeek(date);
    case 'last-of-month':
      return isLastWeekdayOfMonth(date, dayName);
    case 'monthly':
      return isFirstWeekdayOfMonth(date, dayName);
    case 'alternating':
      
      return isEvenWeek(date);
    default:
      return true;
  }
}

function getClubsForDate(date) {
  if (!clubsData || !clubsData.clubs || !isClubsEnabled()) return [];
  
  const selectedClubIds = getSelectedClubs();
  if (selectedClubIds.length === 0) return [];
  
  const dayName = getDayNameFromDate(date);
  
  return clubsData.clubs.filter(club => {
    
    if (!selectedClubIds.includes(club.id)) return false;
    
    return doesClubMeetOnDate(club, date);
  }).map(club => {
    
    return {
      ...club,
      startMinutes: club.startHour * 60 + club.startMinute,
      endMinutes: club.endHour * 60 + club.endMinute
    };
  }).sort((a, b) => a.startMinutes - b.startMinutes);
}

function formatClubTime(club) {
  const formatTime = (h, m) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };
  return `${formatTime(club.startHour, club.startMinute)} - ${formatTime(club.endHour, club.endMinute)}`;
}

function renderClubsForDay(date, showHeader = true) {
  const clubs = getClubsForDate(date);
  if (clubs.length === 0) return '';
  
  let html = '';
  if (showHeader) {
    html += '<div class="clubsSection"><h3>My Clubs</h3>';
  }
  html += '<table class="scheduleTable clubsTable"><thead><tr><th>Club</th><th>Time</th><th>Room</th></tr></thead><tbody>';
  
  clubs.forEach(club => {
    html += `<tr><td>${club.name}</td><td>${formatClubTime(club)}</td><td>${club.room}</td></tr>`;
  });
  
  html += '</tbody></table>';
  if (showHeader) html += '</div>';
  
  return html;
}


function initPackUpNotifications() {
  
  if ('Notification' in window && localStorage.getItem('notifications-enabled') === 'true') {
    
    if (Notification.permission === 'granted') {
      
      startPackUpMonitoring();
    } else if (Notification.permission !== 'denied') {
      
      console.log('Notifications not yet enabled, user needs to enable in settings');
    }
  }
}

function startPackUpMonitoring() {
  
  if (window.packUpInterval) {
    clearInterval(window.packUpInterval);
  }
  
  
  window.packUpInterval = setInterval(() => {
    checkPackUpTime();
    checkPhoneCaddyTime();
  }, 60000); 
  
  
  checkPackUpTime();
  checkPhoneCaddyTime();
}

function checkPhoneCaddyTime() {
  const now = new Date();
  if (localStorage.getItem('notifications-enabled') !== 'true') return;
  const caddyEnabled = localStorage.getItem('phone-caddy-enabled') === 'true';
  if (!caddyEnabled) return;

  const dayOfWeek = now.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return;
  
  const holiday = getHolidayForDate(now);
  if (holiday) return;

  const schedules = getSchedules(now);
  const todayName = getDayNameFromDate(now);
  const todaySchedule = schedules[todayName];
  
  if (!todaySchedule || todaySchedule.length === 0) return;

  const caddyTimes = JSON.parse(localStorage.getItem('phone-caddy-times') || '{}');
  
  for (let i = 0; i < todaySchedule.length; i++) {
    const period = todaySchedule[i];
    
    let periodNumMatch = period.name.match(/Period\s*(\d)/i);
    if (!periodNumMatch) continue;
    let periodNum = periodNumMatch[1];
    
    let assignedSpot = caddyTimes[periodNum];
    if (!assignedSpot || assignedSpot.trim() === '') continue;

    const periodStartTime = new Date(now);
    periodStartTime.setHours(0, period.start, 0, 0);

    const periodEndTime = new Date(now);
    periodEndTime.setHours(0, period.end, 0, 0);

    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const notifStartMins = (periodStartTime.getHours() * 60 + periodStartTime.getMinutes()) - 1;
    const notifEndMins = (periodEndTime.getHours() * 60 + periodEndTime.getMinutes()) - 1;

    if (nowMinutes === notifStartMins) {
      if (Notification.permission === 'granted') {
        sendNotification('Phone Caddy', {
          body: `Class starts in 1 minute! Put your phone in caddy spot #${assignedSpot}`,
          icon: '/icons/icon-192.png',
          tag: `caddy-start-${periodNum}`
        });
      }
    } else if (nowMinutes === notifEndMins) {
      if (Notification.permission === 'granted') {
        sendNotification('Phone Caddy', {
          body: `Class ends in 1 minute! Grab your phone from caddy spot #${assignedSpot}`,
          icon: '/icons/icon-192.png',
          tag: `caddy-end-${periodNum}`
        });
      }
    }
  }
}

function checkPackUpTime() {
  const now = new Date();
  const packUpTimeMinutes = parseInt(localStorage.getItem('pack-up-time') || '0', 10);
  
  
  if (packUpTimeMinutes <= 0) return;
  
  
  const dayOfWeek = now.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return;
  
  
  const holiday = getHolidayForDate(now);
  if (holiday) return;
  
  
  const schedules = getSchedules(now);
  const todayName = getDayNameFromDate(now);
  const todaySchedule = schedules[todayName];
  
  if (!todaySchedule || todaySchedule.length === 0) return;
  
  
  for (let i = 0; i < todaySchedule.length; i++) {
    const period = todaySchedule[i];
    const periodEndTime = new Date(now);
    periodEndTime.setHours(0, period.end, 0, 0);
    
    
    const notificationTime = new Date(periodEndTime);
    notificationTime.setMinutes(periodEndTime.getMinutes() - packUpTimeMinutes);
    
    
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const notificationMinutes = notificationTime.getHours() * 60 + notificationTime.getMinutes();
    
    if (nowMinutes === notificationMinutes) {
      showPackUpNotification(period);
      break; 
    }
  }
}

function showPackUpNotification(period) {
  if (Notification.permission !== 'granted') return;
  
  const packUpTimeMinutes = parseInt(localStorage.getItem('pack-up-time') || '0', 10);
  const todayName = getDayNameFromDate(new Date());
  
  sendNotification('Pack Up Time!', {
    body: `Time to pack up for ${period.name} in ${packUpTimeMinutes} minutes (${todayName})`,
    icon: '/icons/icon-192.png',
    tag: 'pack-up-reminder'
  });
}

async function initApp() {
  
  const DATA_VERSION = '2.2';
  const currentVersion = localStorage.getItem('dataVersion');
  if (currentVersion !== DATA_VERSION) {
    // Preserve user data and preferences
    localStorage.setItem('dataVersion', DATA_VERSION);
  }
  
  await loadData();
  
  const now = new Date();
  const sem2Start = new Date(2026, 0, 24); 
  if (now >= sem2Start && !localStorage.getItem('sem2ResetDone')) {
    
    localStorage.setItem('lunchPreferences', JSON.stringify({Monday:'A',Tuesday:'A',Wednesday:'All',Thursday:'A',Friday:'A'}));
    localStorage.setItem('sem2ResetDone', 'true');
  }
  
  loadLunchPreferences();
  loadThemeOnPage();
  if (document.getElementById('holidayCountdown')) {
    updateHolidayCountdown();
    setInterval(updateHolidayCountdown, 1000);
  }
  if (document.getElementById('holidayTableBody')) {
    updateHolidayTable();
  }
  
  
  initPackUpNotifications();
}

(function injectGlobalSidebar() {
  if (window.location.pathname.startsWith('/setup')) return;

  const navLinks = [
    { href: '/', icon: '🏠', text: 'Home' },
    { href: '/today', icon: '📅', text: 'Today' },
    { href: '/week', icon: '🗓️', text: 'Week' },
    { href: '/month', icon: '📆', text: 'Month' },
    { href: '/schedules', icon: '⏰', text: 'All Schedules' },
    { href: '/events', icon: '🎉', text: 'Events' },
    { href: '/holidays', icon: '🏖️', text: 'Holidays' },
    { href: '/quarters', icon: '📊', text: 'Quarters' },
    { href: '/info', icon: 'ℹ️', text: 'Info' },
    { href: '/settings', icon: '⚙️', text: 'Settings' }
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
  mobileToggle.innerHTML = '☰';
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
    linksHtml += `<a href="${link.href}" class="sidebar-link ${isActive ? 'active' : ''}" data-index="${index}"><span class="sidebar-icon">${link.icon}</span> <span class="sidebar-text">${link.text}</span></a>`;
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
    if (!linkEl) return;
    const linkRect = linkEl.getBoundingClientRect();
    const containerRect = linksContainer.getBoundingClientRect();
    bubble.style.top = (linkRect.top - containerRect.top + linksContainer.scrollTop) + 'px';
    bubble.style.height = linkRect.height + 'px';
    bubble.style.opacity = '1';
  }

  const activeLink = sidebar.querySelector('.sidebar-link.active');
  if (activeLink) {
    setTimeout(() => updateBubble(activeLink), 50);
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
      // allow ctrl+click to work normally
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      updateBubble(link);
      
      setTimeout(() => {
        window.location.href = linkUrl;
      }, 180);
    });
  });

  mobileToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    const mask = document.getElementById('sidebarMask') || createMask();
    mask.classList.toggle('show');
  });

  function createMask() {
    const m = document.createElement('div');
    m.id = 'sidebarMask';
    m.className = 'sidebar-mask';
    document.body.appendChild(m);
    m.addEventListener('click', () => {
      sidebar.classList.remove('open');
      m.classList.remove('show');
    });
    return m;
  }
})();


async function sendNotification(title, options) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    } catch (e) { console.warn(e); }
  }
  const n = new Notification(title, options);
  n.onclick = function() { window.focus(); this.close(); };
  setTimeout(() => n.close(), 5000);
}
