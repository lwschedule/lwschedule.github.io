// Schedule parsing, lunch resolution, time formatting

const MAX_CLASS_SLOTS = 6;

const SCHEDULE_METADATA = [
  {
    scheduleKey: 'leapDay',
    dateStart: new Date(2026, 4, 18),
    dateEnd: new Date(2026, 4, 22),
    storageKey: 'leapDayLunchPreferences'
  },
  {
    scheduleKey: 'memorialDay',
    dateStart: new Date(2026, 4, 25),
    dateEnd: new Date(2026, 4, 29),
    storageKey: 'memorialDayLunchPreferences'
  },
  {
    scheduleKey: 'movingUp',
    dateStart: new Date(2026, 5, 8),
    dateEnd: new Date(2026, 5, 12),
    storageKey: 'movingUpLunchPreferences'
  },
  {
    scheduleKey: 'lastWeek',
    dateStart: new Date(2026, 5, 15),
    dateEnd: new Date(2026, 5, 19),
    storageKey: 'lastWeekLunchPreferences'
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

function getPeriodNumberFromName(periodName) {
  if (typeof periodName !== 'string') return null;
  const match = periodName.match(/Period\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

function getClassTitleForPeriod(periodName) {
  if (!isClassesEnabled()) return null;
  const periodNum = getPeriodNumberFromName(periodName);
  if (periodNum === null || periodNum < 1 || periodNum > MAX_CLASS_SLOTS) return null;
  const slots = getSelectedClassesSlots();
  return slots[periodNum - 1] || null;
}

function getDisplayPeriodName(periodName) {
  const classTitle = getClassTitleForPeriod(periodName);
  return classTitle || periodName;
}

function getScheduleSummaryLabel(periodName, useClassTitles = true) {
  if (!useClassTitles) {
    return periodName.replace(/\(.*?\)/g, '').trim();
  }
  const periodNum = getPeriodNumberFromName(periodName);
  if (periodNum !== null && periodNum >= 1 && periodNum <= MAX_CLASS_SLOTS) {
    if (isClassesEnabled()) {
      const slots = getSelectedClassesSlots();
      if (slots[periodNum - 1]) return slots[periodNum - 1];
    }
    const baseName = periodName.replace(/\(.*?\)/g, '').trim().replace(/\s+/g, ' ');
    const lunchMatch = periodName.match(/\(([^)]*Lunch[^)]*)\)/i);
    if (lunchMatch) return `${baseName} (${lunchMatch[1]})`;
    return baseName;
  }
  const lunchMatch = periodName.match(/\(([^)]*)\)/);
  if (lunchMatch) return `Break (${lunchMatch[1]})`;
  return periodName.replace(/\(.*?\)/g, '').trim();
}

function normalizeLunchChoice(value) {
  return value === 'B' ? 'B' : 'A';
}

function getNearbyPeriodNumber(schedule, lunchIndex) {
  if (lunchIndex > 0 && schedule[lunchIndex - 1]) {
    const num = getPeriodNumberFromName(schedule[lunchIndex - 1].name);
    if (num !== null) return num;
  }
  if (lunchIndex < schedule.length - 1 && schedule[lunchIndex + 1]) {
    const num = getPeriodNumberFromName(schedule[lunchIndex + 1].name);
    if (num !== null) return num;
  }
  return null;
}

function getLunchContextPeriodForDay(baseScheduleDay) {
  if (!baseScheduleDay || !baseScheduleDay.A) return null;
  const aPeriods = baseScheduleDay.A;
  const bPeriods = baseScheduleDay.B;
  const aLunchIdx = aPeriods.findIndex(p => p.name && p.name.includes('Lunch'));
  const bLunchIdx = bPeriods.findIndex(p => p.name && p.name.includes('Lunch'));

  const aPeriodNum = getNearbyPeriodNumber(aPeriods, aLunchIdx);
  const bPeriodNum = getNearbyPeriodNumber(bPeriods, bLunchIdx);

  if (aPeriodNum === bPeriodNum) return aPeriodNum;
  if (aPeriodNum !== null && bPeriodNum === null) return aPeriodNum;
  if (bPeriodNum !== null && aPeriodNum === null) return bPeriodNum;
  return aPeriodNum || bPeriodNum;
}

function getLunchPreferencesForScheduleKey(scheduleKey) {
  const meta = SCHEDULE_METADATA.find(m => m.scheduleKey === scheduleKey);
  if (meta && meta.storageKey) {
    try {
      const stored = localStorage.getItem(meta.storageKey);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
  }
  return lunchPreferences || getDefaultLunchPrefs();
}

function getLunchForScheduleDay(scheduleKey, today, baseScheduleDay, baseSchedule) {
  if (!baseScheduleDay || typeof baseScheduleDay !== 'object' || Array.isArray(baseScheduleDay) || !baseScheduleDay.A) {
    return 'A';
  }
  const prefs = getLunchPreferencesForScheduleKey(scheduleKey);
  let result = prefs && prefs[today] ? normalizeLunchChoice(prefs[today]) : 'A';

  if (baseScheduleDay[result]) return result;
  if (baseScheduleDay.A) return 'A';
  if (baseScheduleDay.B) return 'B';

  const contextPeriodNum = getLunchContextPeriodForDay(baseScheduleDay);
  if (contextPeriodNum !== null) {
    const normalDay = baseSchedule[today];
    if (normalDay && !Array.isArray(normalDay) && typeof normalDay === 'object') {
      const allPeriods = normalDay.A || [];
      for (const [i, dayPrefs] of Object.entries(prefs)) {
        if (dayPrefs === 'B') continue;
        const dayInfer = getLunchContextPeriodForDay(baseSchedule[dayPrefs === 'A' ? i : i]);
        if (dayInfer === contextPeriodNum) return 'A';
      }
      for (const [i, dayPrefs] of Object.entries(prefs)) {
        if (dayPrefs === 'A') continue;
        const dayInfer = getLunchContextPeriodForDay(baseSchedule[dayPrefs === 'B' ? i : i]);
        if (dayInfer === contextPeriodNum) return 'B';
      }
    }
  }
  return 'A';
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

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function getTorphWorkaroundNeeded() {
  if (!isIOS()) return false;
  const safariMatch = navigator.userAgent.match(/Version\/(\d+)/);
  const safariVersion = safariMatch ? parseInt(safariMatch[1], 10) : 0;
  return safariVersion < 17;
}

window.__lws_common_loaded = true;

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

    if (holiday.name === "Summer Break") {
      const start = new Date(2026, 5, 18).getTime();
      const end = new Date(2026, 7, 31).getTime();
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
  if (!holidays) return null;
  const holiday = holidays.find(h => h.name === holidayName);
  return holiday ? holiday.date : null;
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

function minutesNow() {
  const d = new Date();
  return d.getHours()*60 + d.getMinutes();
}
