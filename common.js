let lunchPreferences = null;
let holidays = null;
let schedulesData = null;
let academicTerms = null;
let clubsData = null;
let lastNextPeriodText = null;

const MAX_CLASS_SLOTS = 6;

const PACIFIC_TZ = 'America/Los_Angeles';

function getPacificNow() {
  const s = new Date().toLocaleString('en-US', { timeZone: PACIFIC_TZ });
  return new Date(s);
}



const SCHEDULE_METADATA = [
  {
    scheduleKey: 'first-week',
    dateStart: new Date(2026, 7, 31),
    dateEnd: new Date(2026, 8, 4),
    label: 'First Week Schedule'
  },
  {
    scheduleKey: 'labor-day',
    dateStart: new Date(2026, 8, 7),
    dateEnd: new Date(2026, 8, 11),
    label: 'Labor Day'
  },
  {
    scheduleKey: 'homecoming',
    dateStart: new Date(2026, 8, 28),
    dateEnd: new Date(2026, 9, 2),
    label: 'Homecoming Week'
  }
];

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
  return localStorage.getItem('classesEnabled') === 'true';
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

function getProfileName() {
  return localStorage.getItem('profileName') || '';
}

function setProfileName(name) {
  localStorage.setItem('profileName', name);
}

function getProfileInitials() {
  return localStorage.getItem('profileInitials') || '';
}

function setProfileInitials(initials) {
  localStorage.setItem('profileInitials', initials.slice(0, 2).toUpperCase());
}

function getProfileFollowedEvents() {
  try {
    const saved = localStorage.getItem('profileFollowedEvents');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function setProfileFollowedEvents(ids) {
  localStorage.setItem('profileFollowedEvents', JSON.stringify(ids));
}

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
      window.location.replace(url.href);
    } else {
      window.location.href = url.href;
    }
  }, PAGE_TRANSITION_DURATION_MS);
}

function handlePageTransitionClick(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const anchor = event.target.closest ? event.target.closest('a[href]') : null;
  if (!anchor) return;
  if (anchor.target && anchor.target !== '_self') return;
  if (anchor.hasAttribute('download')) return;
  if (anchor.dataset.transition === 'skip') return;

  const href = anchor.getAttribute('href');
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
  if (lowerName.includes('kang news')) return 'KNews';
  if (lowerName === 'leap') return 'LEAP';
  return periodName;
}

function checkSetupComplete() {
  const lunch = localStorage.getItem('lunchPreferences');

  if (!lunch && !window.location.pathname.includes('/setup')) {
    navigateWithTransition('/setup', { replace: true });
    return false;
  }
  return true;
}

function loadLunchPreferences() {
  try {
    const saved = localStorage.getItem('lunchPreferences');
    if (saved) lunchPreferences = JSON.parse(saved);
  } catch (e) {}
}

window.__lws_common_loaded = true;

function getDefaultLunchPrefs() {
  return { Monday: 'A', Tuesday: 'A', Wednesday: 'All', Thursday: 'A', Friday: 'A' };
}

function getLunchPrefs() {
  try {
    const saved = localStorage.getItem('lunchPreferences');
    if (!saved) return { ...getDefaultLunchPrefs() };
    const parsed = JSON.parse(saved);
    return {
      Monday: parsed.Monday || 'A',
      Tuesday: parsed.Tuesday || 'A',
      Wednesday: parsed.Wednesday || 'All',
      Thursday: parsed.Thursday || 'A',
      Friday: parsed.Friday || 'A'
    };
  } catch (e) {
    return { ...getDefaultLunchPrefs() };
  }
}

function setLunchPrefs(prefs) {
  localStorage.setItem('lunchPreferences', JSON.stringify(prefs));
}

function updateLunchBtns(prefs) {
  document.querySelectorAll('.lunchBtn[data-period]').forEach(btn => {
    const period = btn.dataset.period;
    const lunch = btn.dataset.lunch;
    const currentLunch = period === '3' ? prefs.Monday : prefs.Tuesday;
    btn.classList.toggle('selected', currentLunch === lunch);
  });
}

function initLunchBtnListeners(prefs, onSave) {
  document.querySelectorAll('.lunchBtn[data-period]').forEach(btn => {
    btn.addEventListener('click', () => {
      const period = btn.dataset.period;
      const lunch = btn.dataset.lunch;
      if (period === '3') {
        prefs.Monday = lunch;
        prefs.Friday = lunch;
      } else {
        prefs.Tuesday = lunch;
        prefs.Thursday = lunch;
      }
      updateLunchBtns(prefs);
      if (onSave) onSave(prefs);
    });
  });
}

function normalizeLunchChoice(value) {
  return value === 'B' ? 'B' : 'A';
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function getTorphWorkaroundNeeded() {
  if (!isIOS()) return false;
  const safariMatch = navigator.userAgent.match(/Version\/(\d+)/);
  const safariVersion = safariMatch ? parseInt(safariMatch[1], 10) : 0;

  return safariVersion < 17;
}

function ensureMorphHost(containerEl, className) {
  if (!containerEl) return null;
  let host = containerEl.querySelector(`.${className}`);
  if (!host) {
    const initial = containerEl.textContent || '00';
    containerEl.textContent = '';
    host = document.createElement('span');
    host.className = className;
    host.textContent = initial;
    containerEl.appendChild(host);
  }
  return host;
}

function getLunchPreferencesForScheduleKey(scheduleKey) {
  const defaults = getDefaultLunchPrefs();


  const metadata = SCHEDULE_METADATA.find(m => m.scheduleKey === scheduleKey);
  const storageKey = metadata?.storageKey;


  if (storageKey) {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(`Failed to load ${storageKey}:`, e);
    }
  }


  return lunchPreferences || schedulesData?.lunchPreferences || defaults;
}

function getNearbyPeriodNumber(schedule, lunchIndex) {
  const periodRegex = /\bPeriod\s+(\d)\b/i;
  for (let i = lunchIndex + 1; i < schedule.length; i++) {
    const match = schedule[i].name.match(periodRegex);
    if (match) return parseInt(match[1], 10);
  }
  for (let i = lunchIndex - 1; i >= 0; i--) {
    const match = schedule[i].name.match(periodRegex);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

function getLunchContextPeriodForDay(baseScheduleDay) {
  if (!baseScheduleDay || Array.isArray(baseScheduleDay) || !baseScheduleDay.A || !baseScheduleDay.B) return null;
  const lunchRegex = /\blunch\b/i;

  const aLunchIndex = baseScheduleDay.A.findIndex(p => lunchRegex.test(p.name));
  const bLunchIndex = baseScheduleDay.B.findIndex(p => lunchRegex.test(p.name));
  if (aLunchIndex === -1 && bLunchIndex === -1) return null;

  const aPeriod = aLunchIndex === -1 ? null : getNearbyPeriodNumber(baseScheduleDay.A, aLunchIndex);
  const bPeriod = bLunchIndex === -1 ? null : getNearbyPeriodNumber(baseScheduleDay.B, bLunchIndex);

  if (aPeriod && bPeriod && aPeriod === bPeriod) return aPeriod;
  return aPeriod || bPeriod || null;
}

function getLunchForScheduleDay(scheduleKey, today, baseScheduleDay, baseSchedule) {
  const lunchPrefs = getLunchPreferencesForScheduleKey(scheduleKey);
  const todayChoice = lunchPrefs?.[today];

  if (!baseScheduleDay || Array.isArray(baseScheduleDay)) {
    return normalizeLunchChoice(todayChoice);
  }

  const targetPeriod = getLunchContextPeriodForDay(baseScheduleDay);
  if (!targetPeriod || !baseSchedule) {
    return normalizeLunchChoice(todayChoice);
  }

  const candidateDays = [
    today,
    ...Object.keys(baseSchedule).filter(day => day !== today)
  ];

  for (const day of candidateDays) {
    const daySchedule = baseSchedule[day];
    if (getLunchContextPeriodForDay(daySchedule) !== targetPeriod) continue;
    const pref = lunchPrefs?.[day];
    if (pref === 'A' || pref === 'B') return pref;
  }

  return normalizeLunchChoice(todayChoice);
}

function getSchedules(date) {
  if (!schedulesData) return {};


  const scheduleKey = getScheduleKeyForDate(date);


  let scheduleData;
  if (scheduleKey === 'normal') {
    scheduleData = schedulesData.normal;
  } else {
    scheduleData = schedulesData.normal[scheduleKey];
  }

  if (!scheduleData) return {};

  const baseSchedule = scheduleData;
  const today = getDayNameFromDate(date);

  const lunch = getLunchForScheduleDay(scheduleKey, today, baseSchedule[today], baseSchedule);

  const adjusted = { ...baseSchedule };
  if (today === 'Monday' || today === 'Tuesday' || today === 'Thursday' || today === 'Friday') {
    if (baseSchedule[today][lunch]) {
      adjusted[today] = baseSchedule[today][lunch];
    }
  }
  return adjusted;
}

function getScheduleKeyForDate(date) {

  const testDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());


  for (const schedule of SCHEDULE_METADATA) {
    if (testDate >= schedule.dateStart && testDate <= schedule.dateEnd) {
      return schedule.scheduleKey;
    }
  }


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

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getDayNameFromDate(date) {
  return DAY_NAMES[date.getDay()];
}

function currentDayName() {
  return getDayNameFromDate(getPacificNow());
}

function getNowParts() {
  const nowDate = getPacificNow();
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
    const holidayTime = holiday.date.getTime();
    if (checkTime === holidayTime) return holiday.name;
    if (holiday.name === "Thanksgiving Break") {
      const start = new Date(2026, 10, 26).getTime();
      const end = new Date(2026, 10, 27).getTime();
      if (checkTime >= start && checkTime <= end) return holiday.name;
    }

    if (holiday.name === "Winter Break") {
      const start = new Date(2026, 11, 21).getTime();
      const end = new Date(2027, 0, 1).getTime();
      if (checkTime >= start && checkTime <= end) return holiday.name;
    }

    if (holiday.name === "Mid-Winter Break") {
      const start = new Date(2027, 1, 11).getTime();
      const end = new Date(2027, 1, 12).getTime();
      if (checkTime >= start && checkTime <= end) return holiday.name;
    }

    if (holiday.name === "Spring Break") {
      const start = new Date(2027, 3, 12).getTime();
      const end = new Date(2027, 3, 16).getTime();
      if (checkTime >= start && checkTime <= end) return holiday.name;
    }

    if (holiday.name === "Summer Break") {
      const start2026 = new Date(2026, 5, 17).getTime();
      const end2026 = new Date(2026, 7, 30).getTime();
      if (checkTime >= start2026 && checkTime <= end2026) return holiday.name;
      const start2027 = new Date(2027, 5, 17).getTime();
      const end2027 = new Date(2027, 8, 1).getTime();
      if (checkTime >= start2027 && checkTime <= end2027) return holiday.name;
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



  if (window.updateClockMorphs && document.body.classList.contains('homePage')) {
    try {
      window.updateClockMorphs(data);
      return;
    } catch (error) {
      console.warn('Clock morph update failed, falling back to textContent.', error);
    }
  }

  if (daysEl) daysEl.textContent = data.days ? data.days.toString().padStart(2,'0') : '00';
  if (hoursEl) hoursEl.textContent = data.hours !== undefined ? data.hours.toString().padStart(2,'0') : '00';
  if (minutesEl) minutesEl.textContent = data.minutes.toString().padStart(2,'0');
  if (secondsEl) secondsEl.textContent = data.seconds.toString().padStart(2,'0');
}

function displayMessage(container, message) {
  container.innerHTML = `<div class="time-block" style="width: 100%;"><span class="time-value" style="font-size: 1.5em;">${message}</span></div>`;
}

function getNextSchoolDayStartTime() {
  let nextDay = getPacificNow();
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

  if (holidayName === "Summer Break") return new Date(2026, 7, 31, 23, 59, 59);
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

function updateNextPeriodText(timerEl, text) {
  if (!timerEl) return;

  if (text === lastNextPeriodText) return;
  lastNextPeriodText = text;

  if (typeof window.updateNextPeriodBlock === 'function') {
    try {
      window.updateNextPeriodBlock(text);
    } catch (error) {
      console.warn('Next period morph update failed, falling back to textContent.', error);
      timerEl.textContent = text;
    }
  } else {
    timerEl.textContent = text;
  }

  timerEl.classList.remove('hidden');
}

function updateClock() {
  const shouldRefreshToday = Boolean(document.getElementById('todayContent'));
  const { nowDate, weekday, minutes: now, seconds: secs } = getNowParts();
  const clockDisplay = document.getElementById('clockDisplay');
  const clockLabel = document.getElementById('clockLabel');
  const timerEl = document.getElementById('timer');
  if (!clockDisplay || !clockLabel || !timerEl) {
    if (shouldRefreshToday) updateTodaySchedule();
    return;
  }

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

      updateNextPeriodText(timerEl, getNextPeriodInfoForHoliday(nowDate));
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

        updateNextPeriodText(timerEl, getNextPeriodInfoForHoliday(nowDate));
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

    updateNextPeriodText(timerEl, getNextPeriodInfo(today, now, nowDate));
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

      updateNextPeriodText(timerEl, getNextPeriodInfo(today, now, nowDate));
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

        updateNextPeriodText(timerEl, getNextPeriodInfoForHoliday(nowDate));
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

      updateNextPeriodText(timerEl, getNextPeriodInfo(today, now, nowDate));
    }
  }

  if (shouldRefreshToday) updateTodaySchedule();
}

function minutesNow() {
  const d = getPacificNow();
  return d.getHours()*60 + d.getMinutes();
}

function getClubMinutesNow() {
  const d = getPacificNow();
  return d.getHours() * 60 + d.getMinutes();
}

function isClubActive(club) {
  const clubStart = club.startHour * 60 + club.startMinute;
  const clubEnd = club.endHour * 60 + club.endMinute;
  const now = getClubMinutesNow();
  return now >= clubStart && now < clubEnd;
}

function clubOverlapsPeriod(club, period) {
  const clubStart = club.startHour * 60 + club.startMinute;
  const clubEnd = club.endHour * 60 + club.endMinute;
  const periodStart = period.start;
  const periodEnd = period.end;
  return !(clubEnd <= periodStart || clubStart >= periodEnd);
}

function getActiveClubForDay(date) {
  const clubs = getClubsForDate(date);
  return clubs.find(club => isClubActive(club)) || null;
}

function getClubTimeRange(club) {
  if (!club) return null;
  return {
    startMinutes: club.startMinutes ?? (club.startHour * 60 + club.startMinute),
    endMinutes: club.endMinutes ?? (club.endHour * 60 + club.endMinute)
  };
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
    const active = now !== null && now >= p.start && now < p.end && !(activeClub && clubOverlapsPeriod(activeClub, p));
    html += `<tr class='${active?"highlight":""}'><td>${getDisplayPeriodName(p.name)}</td><td>${format(p.start)}</td><td>${format(p.end)}</td>`;
    if (showDuration) html += `<td>${formatDuration(duration)}</td>`;
    html += "</tr>";
  }
  html += "</tbody></table>";
  return html;
}

function getClubOverlapSummary(date) {
  const clubs = getClubsForDate(date);
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
  const now = getPacificNow();
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

      if (clubCount > 0 && isClubsEnabled()) {
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
      navigateWithTransition(`/week/day/?day=${day}&date=${encodeURIComponent(date)}`);
    });
  });
}

function updateTodaySchedule() {
  const scheduleEl = document.getElementById('todayContent');
  if (!scheduleEl) return;
  const now = getPacificNow();
  const holiday = getHolidayForDate(now);
  if (holiday) {
    scheduleEl.innerHTML = `<div class="noSchoolMessage"><h3>${holiday}</h3><p>Enjoy the holiday!</p></div>`;
    return;
  }
  const schedules = getSchedules(now);
  const today = schedules[currentDayName()];
  const activeClub = getActiveClubForDay(now);
  let html = renderScheduleTable(today, minutesNow(), true, activeClub);

  if (activeClub) {
    html += renderClubCountdown(activeClub, activeClub);
  }

  const clubsHtml = renderClubsForDay(now, true);
  if (clubsHtml) {
    html += clubsHtml;
  }

  scheduleEl.innerHTML = html;
}

function updateHolidayTable() {
  const tbody = document.getElementById('holidayTableBody');
  if (!tbody) return;
  const today = getPacificNow();
  today.setHours(0, 0, 0, 0);

  const hasUpcomingHolidays = Array.isArray(holidays) && holidays.some((holiday) => {
    const holidayDate = new Date(holiday.date.getFullYear(), holiday.date.getMonth(), holiday.date.getDate());
    return holidayDate >= today;
  });

  if (!Array.isArray(holidays) || holidays.length === 0 || !hasUpcomingHolidays) {
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:30px; opacity:0.6;">No upcoming holidays.</td></tr>';
    return;
  }
  let html = '';
  holidays.forEach((holiday, index) => {
    const now = getPacificNow();
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

  const now = getPacificNow();
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
      const holidayStartDate = new Date(upcoming.date.getFullYear(), upcoming.date.getMonth(), upcoming.date.getDate());
      const countdownTarget = getLastSchoolDayEndTime(holidayStartDate);

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

  prevBtn.disabled = (currentYear === 2026 && currentMonth === 7);
  nextBtn.disabled = (currentYear === 2027 && currentMonth === 5);
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
  const isFirstMonth = (currentYear === 2026 && currentMonth === 7);
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    if (isFirstMonth) {
      const prevMonthDate = new Date(currentYear, currentMonth - 1, day);

      if (prevMonthDate.getFullYear() < 2026 || (prevMonthDate.getFullYear() === 2026 && prevMonthDate.getMonth() < 7)) {
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
  const today = getPacificNow();
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

  if (dayName === 'Saturday' || dayName === 'Sunday') {
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

  if (currentYear < 2026 || (currentYear === 2026 && currentMonth < 7)) {
    currentMonth = 7;
    currentYear = 2026;
  }
  if (currentYear > 2027 || (currentYear === 2027 && currentMonth > 5)) {
    currentMonth = 5;
    currentYear = 2027;
  }
  renderCalendar();
}

let currentMonth = getPacificNow().getMonth();
let currentYear = getPacificNow().getFullYear();

if (currentYear < 2026 || (currentYear === 2026 && currentMonth < 7)) {
  currentMonth = 7;
  currentYear = 2026;
}
if (currentYear > 2027 || (currentYear === 2027 && currentMonth > 5)) {
  currentMonth = 5;
  currentYear = 2027;
}

function updateCalendarSize() {

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

    holidays = holidays.map(h => {
      const [y, m, d] = h.date.split('-').map(Number);
      return { ...h, date: new Date(y, m - 1, d) };
    });

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

    lunchPreferences = schedulesData.lunchPreferences || getDefaultLunchPrefs();
    loadLunchPreferences();


    if (clubsRes.ok) {
      clubsData = await clubsRes.json();
    }
  } catch (error) {
    console.error('Error loading data:', error);

    schedulesData = {
      normal: {},
      finals: {},
      lunchPreferences: getDefaultLunchPrefs()
    };
    lunchPreferences = schedulesData.lunchPreferences;
    holidays = [];
    academicTerms = { quarters: [], semesters: [] };
    clubsData = { clubs: [] };
  }
}

function isClubsEnabled() {
  return localStorage.getItem('clubsEnabled') === 'true';
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

function renderClubCountdown(club, activeClub) {
  if (!club || !activeClub || club.id !== activeClub.id) {
    return '';
  }

  const clubTimeRange = getClubTimeRange(activeClub);
  if (!clubTimeRange) return '';

  const now = getPacificNow();
  const clubEndTime = new Date(now);
  clubEndTime.setHours(Math.floor(clubTimeRange.endMinutes / 60), clubTimeRange.endMinutes % 60, 0, 0);

  const totalSeconds = Math.max(0, Math.floor((clubEndTime.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  parts.push(`${seconds.toString().padStart(2, '0')}s`);
  const statusText = `Ends in ${parts.join(' ')}`;

  const roomText = activeClub.room && String(activeClub.room).trim() ? activeClub.room : 'TBD';

  return `<div class="clubCountdownSection">
    <div class="clubCountdownHeading">Active Club</div>
    <div class="clubCountdownName">${activeClub.name}</div>
    <div class="clubCountdownMeta">
      <span class="clubCountdownRoom">Room ${roomText}</span>
      <span class="clubCountdownTime">${formatClubTime(activeClub)}</span>
    </div>
    <div class="clubCountdownStatus">${statusText}</div>
  </div>`;
}

function initPackUpNotifications() {
  if ('Notification' in window && localStorage.getItem('notifications-enabled') === 'true') {
    if (Notification.permission === 'granted') {

      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => { startPackUpMonitoring(); }, { timeout: 3000 });
      } else {
        setTimeout(() => { startPackUpMonitoring(); }, 500);
      }
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
  const now = getPacificNow();
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
  const now = getPacificNow();
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
  const todayName = getDayNameFromDate(getPacificNow());

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

    localStorage.setItem('dataVersion', DATA_VERSION);
  }

  await loadData();

  const now = getPacificNow();
  const sem2Start = new Date(2026, 0, 24);
  if (now >= sem2Start && !localStorage.getItem('sem2ResetDone')) {

    localStorage.setItem('lunchPreferences', JSON.stringify({Monday:'A',Tuesday:'A',Wednesday:'All',Thursday:'A',Friday:'A'}));
    localStorage.setItem('sem2ResetDone', 'true');
  }

  if (!localStorage.getItem('yearResetDone')) {
    const keysToRemove = [
      'classesEnabled', 'selectedClasses', 'profileFollowedEvents',
      'lunchPreferences', 'clubsEnabled', 'selectedClubs',
      'notifications-enabled', 'phone-caddy-enabled', 'phone-caddy-times',
      'pack-up-time', 'dataVersion', 'sem2ResetDone'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
    localStorage.setItem('yearResetDone', 'true');
  }

  loadLunchPreferences();
    if (document.getElementById('holidayCountdown')) {
    updateHolidayCountdown();
    setInterval(updateHolidayCountdown, 1000);
  }
  if (document.getElementById('holidayTableBody')) {
    updateHolidayTable();
  }


  initPackUpNotifications();
}

function injectGlobalSidebar() {
  if (window.location.pathname.startsWith('/setup')) return;

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
    { href: '/about', icon: '/icons/src/info.svg', text: 'About' },
    { href: '/whats-new', icon: 'sparkles', text: 'What\u2019s New' }
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

  const pName = getProfileName() || 'Name';
  const pInitials = getProfileInitials() || '?';
  const profileSectionHTML = `
  <div class="sidebar-profile-section">
    <div class="sidebar-profile-divider"></div>
    <a href="/profile" class="sidebar-profile-row">
      <div class="sidebar-profile-avatar">${pInitials}</div>
      <div class="sidebar-profile-info">
        <span class="sidebar-profile-name">${pName}</span>
        <span class="sidebar-profile-sub">View Profile</span>
      </div>
    </a>
  </div>
`;
  sidebar.insertAdjacentHTML('beforeend', profileSectionHTML);

  const profileRow = sidebar.querySelector('.sidebar-profile-row');
  if (profileRow) {
    profileRow.addEventListener('click', (e) => {
      e.preventDefault();
      navigateWithTransition('/profile');
    });
  }

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

if ('requestIdleCallback' in window) {
  requestIdleCallback(() => { injectGlobalSidebar(); syncMobilePrimaryControl(); }, { timeout: 2000 });
} else {
  setTimeout(() => { injectGlobalSidebar(); syncMobilePrimaryControl(); }, 100);
}

if (typeof MutationObserver !== 'undefined') {
  new MutationObserver(syncMobilePrimaryControl).observe(document.body, { childList: true, subtree: true });
}

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

function createClassSlotManager(config) {
  const {
    resultsId = 'classResults',
    searchId = 'classSearch',
    slotsId,
    countId,
    messageId,
    maxSlots = 6,
    css = { row: 'slot-row', empty: 'empty', arrow: 'slot-arrow', card: 'slot-card', period: 'slot-period', value: 'slot-value', clear: 'slot-clear', clearIcon: 'slot-clear-icon' },
    onSave = null,
  } = config;

  let allTitles = [];
  let slots = getSelectedClassesSlots();
  let messageTimeout = null;

  function el(id) { return document.getElementById(id); }
  function searchEl() { return el(searchId); }
  function resultsEl() { return el(resultsId); }
  function slotsEl() { return el(slotsId); }
  function countEl() { return el(countId); }
  function messageEl() { return el(messageId); }

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function save() { if (onSave) onSave(slots); }

  function showMessage(message) {
    const e = messageEl();
    if (!e) return;
    e.textContent = message;
    if (messageTimeout) clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => { e.textContent = ''; }, 2500);
  }

  function updateCount() {
    const e = countEl();
    if (!e) return;
    const filled = slots.filter(Boolean).length;
    e.textContent = `${filled} of ${maxSlots} slots filled`;
  }

  function renderResults(filter) {
    const rEl = resultsEl();
    if (!rEl) return;
    const f = (filter || '').toLowerCase();
    let list = allTitles.filter(name => name.toLowerCase().includes(f));
    const selectedSet = new Set(slots.filter(Boolean));

    list.sort((a, b) => {
      const aIn = selectedSet.has(a), bIn = selectedSet.has(b);
      if (aIn && !bIn) return -1;
      if (!aIn && bIn) return 1;
      return a.localeCompare(b);
    });

    if (list.length === 0) {
      rEl.innerHTML = '<p style="text-align:center; padding: 26px; color: #888;">No classes found</p>';
      return;
    }

    let html = '';
    list.forEach(title => {
      const added = selectedSet.has(title);
      html += `<button type="button" class="class-result ${added ? 'added' : ''}" data-class="${encodeURIComponent(title)}" ${added ? 'disabled' : ''}><span>${escapeHtml(title)}</span><span class="result-tag">${added ? '<img src="/icons/src/checkmark.svg" class="result-tag-icon" alt="">' : '<img src="/icons/src/plus.svg" class="result-tag-icon" alt="">'}</span></button>`;
    });
    rEl.innerHTML = html;

    rEl.querySelectorAll('.class-result:not(.added)').forEach(btn => {
      btn.addEventListener('click', () => {
        add(decodeURIComponent(btn.dataset.class));
      });
    });
  }

  function renderSlotsList() {
    const lEl = slotsEl();
    if (!lEl) return;
    let html = '';

    for (let i = 0; i < maxSlots; i++) {
      const title = slots[i] || '';
      const empty = !title;
      const upDisabled = i === 0 || empty;
      const downDisabled = i === maxSlots - 1 || empty;
      const emptyCls = css.empty ? ` ${css.empty}` : '';

      html += `<div class="${css.row}${empty ? emptyCls : ''}">
        <button type="button" class="${css.arrow}" data-index="${i}" data-dir="up" ${upDisabled ? 'disabled' : ''}>&uarr;</button>
        <div class="${css.card}">
          <div class="${css.period}">Period ${i + 1}</div>
          <div class="${css.value}">${empty ? 'Empty' : escapeHtml(title)}</div>
          ${empty ? '' : `<button type="button" class="${css.clear}" data-clear-index="${i}" aria-label="Remove class from Period ${i + 1}"><img src="/icons/src/minus.svg" class="${css.clearIcon}" alt=""></button>`}
        </div>
        <button type="button" class="${css.arrow}" data-index="${i}" data-dir="down" ${downDisabled ? 'disabled' : ''}>&darr;</button>
      </div>`;
    }

    lEl.innerHTML = html;

    lEl.querySelectorAll(`.${css.arrow}`).forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index, 10);
        const dir = btn.dataset.dir;
        move(index, dir === 'up' ? index - 1 : index + 1);
      });
    });

    lEl.querySelectorAll(`.${css.clear}`).forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.clearIndex, 10);
        slots[idx] = '';
        save();
        renderSlotsList();
        renderResults(searchEl() ? searchEl().value : '');
      });
    });

    updateCount();
  }

  function promptReplace(title) {
    const choice = prompt(`All ${maxSlots} slots are full. Replace which period slot with "${title}"? Enter 1-${maxSlots}.`);
    if (choice === null) return;
    const idx = parseInt(choice, 10) - 1;
    if (Number.isNaN(idx) || idx < 0 || idx >= maxSlots) {
      showMessage(`Enter a valid slot number from 1 to ${maxSlots}.`);
      return;
    }
    slots[idx] = title;
    save();
    renderSlotsList();
    renderResults(searchEl() ? searchEl().value : '');
    showMessage(`Updated Period ${idx + 1}.`);
  }

  function add(title) {
    if (slots.includes(title)) {
      showMessage('That class is already in your schedule.');
      return;
    }
    const emptyIdx = slots.findIndex(s => !s);
    if (emptyIdx !== -1) {
      slots[emptyIdx] = title;
      save();
      renderSlotsList();
      renderResults(searchEl() ? searchEl().value : '');
      return;
    }
    promptReplace(title);
  }

  function move(fromIdx, toIdx) {
    if (fromIdx < 0 || fromIdx >= maxSlots || toIdx < 0 || toIdx >= maxSlots) return;
    if (!slots[fromIdx]) return;
    const temp = slots[toIdx];
    slots[toIdx] = slots[fromIdx];
    slots[fromIdx] = temp || '';
    save();
    renderSlotsList();
    renderResults(searchEl() ? searchEl().value : '');
  }

  function clearSlot(index) {
    slots[index] = '';
    save();
    renderSlotsList();
    renderResults(searchEl() ? searchEl().value : '');
  }

  function reset() {
    slots = Array(maxSlots).fill('');
    save();
    renderSlotsList();
    renderResults(searchEl() ? searchEl().value : '');
  }

  async function load() {
    try {
      const response = await fetch('/data/classes.json');
      const data = await response.json();
      allTitles = Array.isArray(data.classes) ? data.classes : [];
      renderResults();
      renderSlotsList();
    } catch (error) {
      console.error('Error loading classes:', error);
      const r = resultsEl();
      if (r) r.innerHTML = '<p style="text-align:center; padding: 26px; color: #888;">Error loading classes</p>';
    }
  }

  function getSlots() { return slots; }
  function setSlots(newSlots) { slots = newSlots; }

  return { renderSlots: renderSlotsList, renderResults, add, move, clearSlot, reset, load, getSlots, setSlots, showMessage };
}

function createClubSlotManager(config) {
  const {
    resultsId = 'clubResults',
    searchId = 'clubSearch',
    selectedListId = 'selectedClubsList',
    countId = 'selectedCount',
    css = { row: 'slot-row', card: 'slot-card', value: 'slot-value', clear: 'slot-clear', clearIcon: 'slot-clear-icon' },
    onSave = null,
  } = config;

  let allClubs = [];
  let selectedClubs = [];

  function el(id) { return document.getElementById(id); }

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatDays(club) {
    const days = club.days || (club.day ? [club.day] : []);
    return days.join(', ');
  }

  function save() {
    if (onSave) onSave(selectedClubs);
  }

  function updateCount() {
    const count = selectedClubs.length;
    const text = count === 0 ? 'No clubs selected' :
      count === 1 ? '1 club selected' :
      `${count} clubs selected`;
    const e = el(countId);
    if (e) e.textContent = text;
    const listEl = el(selectedListId);
    if (listEl) listEl.style.display = count === 0 ? 'none' : 'block';
  }

  function renderResults(filter) {
    const rEl = el(resultsId);
    if (!rEl) return;
    const f = (filter || '').toLowerCase();

    let filtered = allClubs.filter(club => {
      const days = club.days || (club.day ? [club.day] : []);
      return club.name.toLowerCase().includes(f) ||
        (club.room || '').toLowerCase().includes(f) ||
        days.some(d => d.toLowerCase().includes(f));
    });

    const selectedSet = new Set(selectedClubs);
    filtered.sort((a, b) => {
      const aIn = selectedSet.has(a.id), bIn = selectedSet.has(b.id);
      if (aIn && !bIn) return -1;
      if (!aIn && bIn) return 1;
      return a.name.localeCompare(b.name);
    });

    if (filtered.length === 0) {
      rEl.innerHTML = '<p style="text-align:center; padding: 26px; color: #888;">No clubs found</p>';
      return;
    }

    let html = '';
    filtered.forEach(club => {
      const isAdded = selectedSet.has(club.id);
      html += `<button type="button" class="club-result ${isAdded ? 'added' : ''}" data-id="${escapeHtml(club.id)}" ${isAdded ? 'disabled' : ''}><span>${escapeHtml(club.name)}</span><span class="result-tag">${isAdded ? '<img src="/icons/src/checkmark.svg" class="result-tag-icon" alt="">' : '<img src="/icons/src/plus.svg" class="result-tag-icon" alt="">'}</span></button>`;
    });
    rEl.innerHTML = html;

    rEl.querySelectorAll('.club-result:not(.added)').forEach(btn => {
      btn.addEventListener('click', () => { add(btn.dataset.id); });
    });
  }

  function renderSelectedList() {
    const listEl = el(selectedListId);
    if (!listEl) return;
    let html = '';

    const objs = selectedClubs.map(id => allClubs.find(c => c.id === id)).filter(Boolean);
    objs.sort((a, b) => a.name.localeCompare(b.name));
    selectedClubs = objs.map(c => c.id);
    save();

    objs.forEach(club => {
      html += `<div class="${css.row}"><div class="${css.card}"><div class="${css.value}">${escapeHtml(club.name)}</div><button type="button" class="${css.clear}" data-id="${escapeHtml(club.id)}" aria-label="Remove ${escapeHtml(club.name)}"><img src="/icons/src/minus.svg" class="${css.clearIcon}" alt=""></button></div></div>`;
    });

    listEl.innerHTML = html;
    listEl.querySelectorAll(`.${css.clear}`).forEach(btn => {
      btn.addEventListener('click', () => {
        selectedClubs = selectedClubs.filter(id => id !== btn.dataset.id);
        save();
        renderSelectedList();
        renderResults(el(searchId) ? el(searchId).value : '');
      });
    });

    updateCount();
  }

  function add(clubId) {
    if (!selectedClubs.includes(clubId)) {
      selectedClubs.push(clubId);
      save();
      renderSelectedList();
      renderResults(el(searchId) ? el(searchId).value : '');
    }
  }

  async function load() {
    try {
      const response = await fetch('/data/clubs.json');
      const data = await response.json();
      allClubs = Array.isArray(data.clubs) ? data.clubs : [];
      renderResults();
      renderSelectedList();
    } catch (error) {
      console.error('Error loading clubs:', error);
      const r = el(resultsId);
      if (r) r.innerHTML = '<p style="text-align:center; padding: 26px; color: #888;">Error loading clubs</p>';
    }
  }

  function initSearch() {
    const sEl = el(searchId);
    if (sEl) sEl.addEventListener('input', (e) => { renderResults(e.target.value); });
  }

  function getSelected() { return selectedClubs; }
  function setSelected(arr) { selectedClubs = arr; }
  function getAll() { return allClubs; }

  return { renderResults, renderSelectedList, add, load, initSearch, getSelected, setSelected, getAll, updateCount, formatDays, escapeHtml };
}

if ('serviceWorker' in navigator) {
  const registerServiceWorker = () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((registration) => {
      // If a worker is already waiting when the page loads, show the banner
      if (registration.waiting) {
        showUpdateBanner(registration.waiting);
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner(newWorker);
          }
        });
      });
    }).catch((err) => {
      console.warn('Service Worker registration failed:', err);
    });
  };

  // Register immediately if the page has already finished loading
  // (common.js may load past `window.load` on cached resources).
  // Otherwise wait for `window.load` so registration doesn't compete with first-paint.
  if (document.readyState === 'complete') {
    registerServiceWorker();
  } else {
    window.addEventListener('load', registerServiceWorker);
  }
}

function showUpdateBanner(worker) {
  // Honor a session-level dismissal so we don't keep nagging on every reload
  try { if (sessionStorage.getItem('lwsUpdateDismissed') === '1') return; } catch (e) {}

  let banner = document.getElementById('updateBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'updateBanner';
    banner.setAttribute('role', 'status');
    banner.innerHTML =
      '<div class="update-banner-icon" aria-hidden="true">' +
        '<img src="/icons/src/arrow.up.forward.svg" alt="">' +
      '</div>' +
      '<div class="update-banner-body">' +
        '<div class="update-banner-title">Update available</div>' +
        '<div class="update-banner-subtitle">A new version is ready — reload to apply.</div>' +
      '</div>' +
      '<div class="update-banner-actions">' +
        '<button id="updateBannerReload" class="update-banner-btn" type="button">Reload</button>' +
        '<button id="updateBannerDismiss" class="update-banner-dismiss" type="button" aria-label="Dismiss update notification">✕</button>' +
      '</div>';
    document.body.appendChild(banner);

    // Store the most recent waiting worker so repeated updatefound events converge on it
    banner.__worker = worker;

    document.getElementById('updateBannerReload').addEventListener('click', () => {
      // Register listener BEFORE sending message to avoid race condition
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
      const targetWorker = banner.__worker;
      if (targetWorker) {
        targetWorker.postMessage({ type: 'SKIP_WAITING' });
      }
      // Fallback: reload after 3s in case controllerchange doesn't fire
      setTimeout(() => { window.location.reload(); }, 3000);
    });

    document.getElementById('updateBannerDismiss').addEventListener('click', () => {
      // Drop focus and hide from a11y tree so screen readers don't keep announcing it
      if (document.activeElement && banner.contains(document.activeElement)) {
        document.activeElement.blur();
      }
      banner.setAttribute('aria-hidden', 'true');
      banner.classList.remove('show');
      try { sessionStorage.setItem('lwsUpdateDismissed', '1'); } catch (e) {}
    });
  } else {
    banner.__worker = worker;
  }
  banner.removeAttribute('aria-hidden');
  banner.classList.add('show');
  // Move keyboard focus to the primary action for accessibility
  const reloadBtn = document.getElementById('updateBannerReload');
  if (reloadBtn) reloadBtn.focus({ preventScroll: true });
}
