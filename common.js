let lunchPreferences = {
  Monday: 'A',
  Tuesday: 'A',
  Wednesday: 'All',
  Thursday: 'A',
  Friday: 'A'
};

const holidays = [
  { name: "Labor Day", date: new Date(2025, 8, 1), displayDate: "September 1, 2025", isWeekend: false },
  { name: "LEAP Day", date: new Date(2025, 9, 17), displayDate: "October 17, 2025", isWeekend: false },
  { name: "LEAP Day", date: new Date(2025, 10, 4), displayDate: "November 4, 2025", isWeekend: false },
  { name: "Veterans Day", date: new Date(2025, 10, 11), displayDate: "November 11, 2025", isWeekend: false },
  { name: "Thanksgiving Break", date: new Date(2025, 10, 27), displayDate: "November 27-29, 2025", isWeekend: true },
  { name: "Winter Break", date: new Date(2025, 11, 20), displayDate: "December 20, 2025 - January 4, 2026", isWeekend: true },
  { name: "MLK Jr. Day", date: new Date(2026, 0, 19), displayDate: "January 19, 2026", isWeekend: true },
  { name: "Mid-Winter Break", date: new Date(2026, 1, 12), displayDate: "February 12-16, 2026", isWeekend: true },
  { name: "Presidents Day", date: new Date(2026, 1, 16), displayDate: "February 16, 2026", isWeekend: true },
  { name: "LEAP Day", date: new Date(2026, 2, 13), displayDate: "March 13, 2026", isWeekend: false },
  { name: "Spring Break", date: new Date(2026, 3, 13), displayDate: "April 13-17, 2026", isWeekend: true },
  { name: "LEAP Day", date: new Date(2026, 4, 22), displayDate: "May 22, 2026", isWeekend: false },
  { name: "Memorial Day", date: new Date(2026, 4, 25), displayDate: "May 25, 2026", isWeekend: true },
  { name: "Last Day of School", date: new Date(2026, 5, 17), displayDate: "June 17, 2026", isWeekend: false }
];

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

function updateRollingText(element, newText) {
  if (!element) return;

  let oldText = element.dataset.previousText;
  if (!oldText) {
    if (element.querySelector('.digit-roller .new')) {
      oldText = element.querySelector('.digit-roller .new').textContent;
    } else {
      oldText = element.textContent;
    }
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
    element.innerHTML = `<span class="digit-roller" style="width: 100%; height: 1em; line-height: 1em;"><span class="old">${oldText}</span><span class="new">${newText}</span></span>`;
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

function isFinalsWeek(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return year === 2026 && month === 0 && day >= 19 && day <= 23;
}

function getSchedules(date) {
  const today = getDayNameFromDate(date);
  const lunch = lunchPreferences[today] || 'A';

  if (isFinalsWeek(date)) {
    return {
      Monday: [],
      Tuesday: [
        { name:"Period 1", start: 8*60+35, end: 9*60+20 },
        { name:"Period 2", start: 9*60+30, end: 10*60+50 },
        ...(lunch === 'A' ? [
          { name:"A Lunch", start: 10*60+50, end: 11*60+20 },
          { name:"Period 4", start: 11*60+30, end: 12*60+50 }
        ] : [
          { name:"Period 4", start: 11*60, end: 12*60+20 },
          { name:"B Lunch", start: 12*60+20, end: 12*60+50 }
        ]),
        { name:"Period 4", start: 13*60, end: 13*60+45 },
        { name:"Period 6", start: 13*60+55, end: 15*60+15 }
      ],
      Wednesday: [
        { name:"Period 1", start: 8*60+35, end: 9*60+55 },
        { name:"Period 3", start: 10*60+5, end: 11*60+25 },
        { name:"Period 5", start: 11*60+35, end: 12*60+55 },
        { name:"Lunch", start: 13*60, end: 13*60+30 }
      ],
      Thursday: [
        { name:"Period 2", start: 8*60+35, end: 9*60+55 },
        { name:"Period 3", start: 10*60+5, end: 10*60+50 },
        ...(lunch === 'A' ? [
          { name:"A Lunch", start: 10*60+50, end: 11*60+20 },
          { name:"Period 4", start: 11*60+30, end: 12*60+50 }
        ] : [
          { name:"Period 4", start: 11*60, end: 12*60+20 },
          { name:"B Lunch", start: 12*60+20, end: 12*60+50 }
        ]),
        { name:"Period 5", start: 13*60, end: 13*60+45 },
        { name:"Period 6", start: 13*60+55, end: 15*60+15 }
      ],
      Friday: [
        { name:"Period 1", start: 8*60+35, end: 9*60+55 },
        { name:"Period 2", start: 10*60+5, end: 10*60+50 },
        ...(lunch === 'A' ? [
          { name:"A Lunch", start: 10*60+50, end: 11*60+20 },
          { name:"Period 3", start: 11*60+30, end: 12*60+50 }
        ] : [
          { name:"Period 3", start: 11*60, end: 12*60+20 },
          { name:"B Lunch", start: 12*60+20, end: 12*60+50 }
        ]),
        { name:"Period 5", start: 13*60, end: 14*60+20 },
        { name:"Period 6", start: 14*60+30, end: 15*60+15 }
      ]
    };
  }

  return {
    Monday: [
      { name:"Period 1", start: 8*60+35, end: 9*60+55 },
      { name:"Period 2", start: 10*60+5, end: 10*60+50 },
      ...(lunch === 'A' ? [
        { name:"A Lunch", start: 10*60+50, end: 11*60+20 },
        { name:"Period 3", start: 11*60+30, end: 12*60+50 }
      ] : [
        { name:"Period 3", start: 11*60, end: 12*60+20 },
        { name:"B Lunch", start: 12*60+20, end: 12*60+50 }
      ]),
      { name:"Period 5", start: 13*60, end: 14*60+20 },
      { name:"Period 6", start: 14*60+30, end: 15*60+15 }
    ],
    Tuesday: [
      { name:"Period 1", start: 8*60+35, end: 9*60+20 },
      { name:"Period 2", start: 9*60+30, end: 10*60+50 },
      ...(lunch === 'A' ? [
        { name:"A Lunch", start: 10*60+50, end: 11*60+20 },
        { name:"Period 4 (Part 1)", start: 11*60+30, end: 12*60+50 }
      ] : [
        { name:"Period 4 (Part 1)", start: 11*60, end: 12*60+20 },
        { name:"B Lunch", start: 12*60+20, end: 12*60+50 }
      ]),
      { name:"Break", start: 12*60+50, end: 13*60 },
      { name:"Period 4 (Part 2)", start: 13*60, end: 13*60+45 },
      { name:"Period 6", start: 13*60+55, end: 15*60+15 }
    ],
    Wednesday: [
      { name:"Period 1", start: 8*60+35, end: 9*60+55 },
      { name:"Period 3", start: 10*60+5, end: 11*60+25 },
      { name:"Period 5", start: 11*60+35, end: 12*60+55 },
      { name:"Lunch", start: 13*60, end: 13*60+30 }
    ],
    Thursday: [
      { name:"Period 2", start: 8*60+35, end: 9*60+55 },
      { name:"Period 3", start: 10*60+5, end: 10*60+50 },
      ...(lunch === 'A' ? [
        { name:"A Lunch", start: 10*60+50, end: 11*60+20 },
        { name:"Period 4", start: 11*60+30, end: 12*60+50 }
      ] : [
        { name:"Period 4", start: 11*60, end: 12*60+20 },
        { name:"B Lunch", start: 12*60+20, end: 12*60+50 }
      ]),
      { name:"Period 5", start: 13*60, end: 13*60+45 },
      { name:"Period 6", start: 13*60+55, end: 15*60+15 }
    ],
    Friday: [
      { name:"Period 1", start: 8*60+35, end: 9*60+23 },
      { name:"Homeroom", start: 9*60+30, end: 10*60+10 },
      { name:"Period 2", start: 10*60+17, end: 11*60+5 },
      ...(lunch === 'A' ? [
        { name:"A Lunch", start: 11*60+5, end: 11*60+35 },
        { name:"Period 3", start: 11*60+42, end: 12*60+30 }
      ] : [
        { name:"Period 3", start: 11*60+12, end: 12*60 },
        { name:"B Lunch", start: 12*60, end: 12*60+30 }
      ]),
      { name:"Period 4", start: 12*60+37, end: 13*60+25 },
      { name:"Period 5", start: 13*60+32, end: 14*60+20 },
      { name:"Period 6", start: 14*60+27, end: 15*60+15 }
    ]
  };
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

function displayTimeBlocks(container, data) {
  const daysId = container.id + '-days';
  const hoursId = container.id + '-hours';
  const minutesId = container.id + '-minutes';
  const secondsId = container.id + '-seconds';

  const existingDays = document.getElementById(daysId);
  const existingHours = document.getElementById(hoursId);
  const existingMinutes = document.getElementById(minutesId);
  const existingSeconds = document.getElementById(secondsId);

  function getPreviousValue(elem, fallback) {
    if (!elem) return fallback;
    if (elem.dataset.previousText) return elem.dataset.previousText;
    if (elem.querySelector('.digit-roller .new')) {
      const newSpan = elem.querySelector('.new');
      return newSpan ? newSpan.textContent : fallback;
    }
    return elem.textContent || fallback;
  }

  const prevDays = getPreviousValue(existingDays, data.days !== undefined ? data.days.toString() : '');
  const prevHours = getPreviousValue(existingHours, data.hours !== undefined ? data.hours.toString().padStart(2,'0') : '');
  const prevMinutes = getPreviousValue(existingMinutes, data.minutes.toString().padStart(2,'0'));
  const prevSeconds = getPreviousValue(existingSeconds, data.seconds.toString().padStart(2,'0'));

  let html = '';
  if (data.days !== undefined) {
    html += `<div class="time-block"><span id="${daysId}" class="time-value">${data.days}</span><span class="time-label">${data.days === 1 ? 'DAY' : 'DAYS'}</span></div>`;
  }
  if (data.hours !== undefined) {
    html += `<div class="time-block"><span id="${hoursId}" class="time-value">${data.hours.toString().padStart(2,'0')}</span><span class="time-label">${data.hours === 1 ? 'HOUR' : 'HOURS'}</span></div>`;
  }
  html += `<div class="time-block"><span id="${minutesId}" class="time-value">${data.minutes.toString().padStart(2,'0')}</span><span class="time-label">MINUTES</span></div>`;
  html += `<div class="time-block"><span id="${secondsId}" class="time-value">${data.seconds.toString().padStart(2,'0')}</span><span class="time-label">SECONDS</span></div>`;

  container.innerHTML = html;

  if (data.days !== undefined) {
    const daysEl = document.getElementById(daysId);
    if (daysEl && prevDays) {
      daysEl.dataset.previousText = prevDays;
    }
  }

  if (data.hours !== undefined) {
    const hoursEl = document.getElementById(hoursId);
    if (hoursEl && prevHours) {
      hoursEl.dataset.previousText = prevHours;
    }
  }

  const minutesEl = document.getElementById(minutesId);
  if (minutesEl && prevMinutes) {
    minutesEl.dataset.previousText = prevMinutes;
    updateRollingText(minutesEl, data.minutes.toString().padStart(2,'0'));
  }

  const secondsEl = document.getElementById(secondsId);
  if (secondsEl && prevSeconds) {
    secondsEl.dataset.previousText = prevSeconds;
    updateRollingText(secondsEl, data.seconds.toString().padStart(2,'0'));
  }

  if (data.days !== undefined) {
    const daysEl = document.getElementById(daysId);
    if (daysEl) updateRollingText(daysEl, data.days.toString());
  }

  if (data.hours !== undefined) {
    const hoursEl = document.getElementById(hoursId);
    if (hoursEl) updateRollingText(hoursEl, data.hours.toString().padStart(2,'0'));
  }
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

function getHolidayForDate(date) {
  const checkTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  for (const holiday of holidays) {
    const holidayTime = new Date(holiday.date.getFullYear(), holiday.date.getMonth(), holiday.date.getDate()).getTime();

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

function loadThemeOnPage() {
  const theme = localStorage.getItem('theme') || 'purple';
  document.body.className = `theme-${theme}`;
}
