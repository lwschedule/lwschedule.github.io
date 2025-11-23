let lunchPreferences = {
  Monday: 'A',
  Tuesday: 'A',
  Wednesday: 'All',
  Thursday: 'A',
  Friday: 'A'
};
let currentHolidayMessage = null;
let quartersInterval = null;

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

const academicTerms = {
  quarters: [
    { name: "1st Quarter", start: new Date(2025, 8, 2, 0, 0, 0), end: new Date(2025, 10, 4, 23, 59, 59) },
    { name: "2nd Quarter", start: new Date(2025, 10, 5, 0, 0, 0), end: new Date(2026, 0, 23, 23, 59, 59) },
    { name: "3rd Quarter", start: new Date(2026, 0, 24, 0, 0, 0), end: new Date(2026, 3, 3, 23, 59, 59) },
    { name: "4th Quarter", start: new Date(2026, 3, 4, 0, 0, 0), end: new Date(2026, 5, 17, 23, 59, 59) }
  ],
  semesters: [
    { name: "1st Semester", start: new Date(2025, 8, 2, 0, 0, 0), end: new Date(2026, 0, 23, 23, 59, 59) },
    { name: "2nd Semester", start: new Date(2026, 0, 24, 0, 0, 0), end: new Date(2026, 5, 17, 23, 59, 59) }
  ]
};

function loadLunchPreferences() {
  try {
    const saved = localStorage.getItem('lunchPreferences');
    if (saved) lunchPreferences = JSON.parse(saved);
  } catch (e) {}
}

function updateRollingText(element, newText) {
  if (!element) return;
  let oldText = element.dataset.previousText || element.textContent;
  if (oldText === newText) return;
  if (oldText === "--" || (oldText && oldText.length !== newText.length)) {
    element.textContent = newText;
    element.dataset.previousText = newText;
    return;
  }
  if (newText && !newText.match(/^[\d: -]+$/) && !newText.match(/d|h|m|s/)) {
    if (oldText !== newText) element.textContent = newText;
    element.dataset.previousText = newText;
    return;
  }
  element.dataset.previousText = newText;
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
}

function isFinalsWeek(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return year === 2026 && month === 0 && day >= 19 && day <= 23;
}

function isThanksgivingWeek(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return year === 2025 && month === 10 && day >= 24 && day <= 26;
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

  if (isThanksgivingWeek(date)) {
    return {
      Monday: [
        { name:"Period 1", start: 8*60+35, end: 9*60+30 },
        { name:"Period 2", start: 9*60+38, end: 10*60+33 },
        { name:"Period 3", start: 10*60+41, end: 11*60+36 },
        ...(lunch === 'A' ? [
          { name:"A Lunch", start: 11*60+36, end: 12*60+6 },
          { name:"Period 4", start: 12*60+14, end: 13*60+9 }
        ] : [
          { name:"Period 4", start: 11*60+44, end: 12*60+39 },
          { name:"B Lunch", start: 12*60+39, end: 13*60+9 }
        ]),
        { name:"Period 5", start: 13*60+17, end: 14*60+12 },
        { name:"Period 6", start: 14*60+20, end: 15*60+15 }
      ],
      Tuesday: [
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
      ],
      Wednesday: [
        { name:"Period 1", start: 8*60+35, end: 9*60 },
        { name:"Period 2", start: 9*60+7, end: 9*60+32 },
        { name:"Period 3", start: 9*60+39, end: 10*60+4 },
        { name:"Period 4", start: 10*60+11, end: 10*60+36 },
        { name:"Period 5", start: 10*60+43, end: 11*60+8 },
        { name:"Period 6", start: 11*60+15, end: 11*60+40 }
      ],
      Thursday: [],
      Friday: []
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

function minutesNow() {
  const d = new Date();
  return d.getHours()*60 + d.getMinutes();
}

function secondsNow() {
  return new Date().getSeconds();
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
  let html = '';
  if (data.days !== undefined) {
    html += `<div class="time-block"><span class="time-value">${data.days}</span><span class="time-label">${data.days === 1 ? 'DAY' : 'DAYS'}</span></div>`;
  }
  if (data.hours !== undefined) {
    html += `<div class="time-block"><span class="time-value">${data.hours.toString().padStart(2, '0')}</span><span class="time-label">${data.hours === 1 ? 'HOUR' : 'HOURS'}</span></div>`;
  }
  html += `<div class="time-block"><span class="time-value">${data.minutes.toString().padStart(2, '0')}</span><span class="time-label">MINUTES</span></div>`;
  html += `<div class="time-block"><span class="time-value">${data.seconds.toString().padStart(2, '0')}</span><span class="time-label">SECONDS</span></div>`;
  container.innerHTML = html;
}

function displayMessage(container, message) {
  container.innerHTML = `<div class="time-block" style="grid-column: 1/-1;"><span class="time-value" style="font-size: 1.5em;">${message}</span></div>`;
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

function formatTermDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCountdownHTML(now, start, end) {
  const nowTime = now.getTime();
  const startTime = start.getTime();
  const endTime = end.getTime();
  if (nowTime > endTime) return `<div class="term-completed-badge">Completed</div>`;
  let diff, label;
  if (nowTime < startTime) { diff = startTime - nowTime; label = "Starts in"; }
  else { diff = endTime - nowTime; label = "Ends in"; }
  const totalSeconds = Math.floor(diff / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  let value, unit;
  if (totalDays > 0) { value = totalDays; unit = totalDays === 1 ? "Day" : "Days"; }
  else if (totalHours > 0) { value = totalHours; unit = totalHours === 1 ? "Hour" : "Hours"; }
  else if (totalMinutes > 0) { value = totalMinutes; unit = totalMinutes === 1 ? "Minute" : "Minutes"; }
  else { value = totalSeconds; unit = totalSeconds === 1 ? "Second" : "Seconds"; }
  return `<div class="term-countdown-block"><span class="countdown-label">${label}</span><span class="countdown-value">${value} ${unit}</span></div>`;
}

function updateQuartersAndSemesters() {
  const now = new Date();
  const quartersListEl = document.getElementById('quartersList');
  const semestersListEl = document.getElementById('semestersList');
  if (!quartersListEl || !semestersListEl) {
    if (quartersInterval) { clearInterval(quartersInterval); quartersInterval = null; }
    return;
  }
  let quartersHTML = '';
  academicTerms.quarters.forEach(term => {
    const isActive = now >= term.start && now <= term.end;
    quartersHTML += `<div class="term-card ${isActive ? 'highlight' : ''}"><div class="term-info"><div class="term-name">${term.name}</div><div class="term-dates">${formatTermDate(term.start)} — ${formatTermDate(term.end)}</div></div><div class="term-countdown">${getCountdownHTML(now, term.start, term.end)}</div></div>`;
  });
  let semestersHTML = '';
  academicTerms.semesters.forEach(term => {
    const isActive = now >= term.start && now <= term.end;
    semestersHTML += `<div class="term-card ${isActive ? 'highlight' : ''}"><div class="term-info"><div class="term-name">${term.name}</div><div class="term-dates">${formatTermDate(term.start)} — ${formatTermDate(term.end)}</div></div><div class="term-countdown">${getCountdownHTML(now, term.start, term.end)}</div></div>`;
  });
  quartersListEl.innerHTML = quartersHTML;
  semestersListEl.innerHTML = semestersHTML;
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
  return uniqueNames.join(',');
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
      window.location.href = `/week/${day}/?date=${encodeURIComponent(date)}`;
    });
  });
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

function renderScheduleTable(schedule, now, showDuration = false) {
  if (!schedule || schedule.length === 0) {
    if (!currentHolidayMessage) {
      const funMessages = ["Have fun!", "Go outside!", "Relax and recharge!", "Enjoy your free time!", "Make it a great day!", "Time to unwind!", "Do something you love!", "Rest up for tomorrow!", "Adventure awaits!", "Explore something new!"];
      currentHolidayMessage = funMessages[Math.floor(Math.random() * funMessages.length)];
    }
    return `<div class="noSchoolMessage"><h3>No School</h3><p>${currentHolidayMessage}</p></div>`;
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

function updateTodaySchedule() {
  const scheduleEl = document.getElementById('todayContent');
  if (!scheduleEl) return;
  const schedules = getSchedules(new Date());
  const today = schedules[currentDayName()];
  scheduleEl.innerHTML = renderScheduleTable(today, minutesNow(), true);
}

function updateDaySchedule() {
  const scheduleEl = document.getElementById('dayContent');
  const titleEl = document.getElementById('dayTitle');
  if (!scheduleEl || !titleEl) return;
  const path = window.location.pathname;
  const dayMatch = path.match(/\/week\/(\w+)\//);
  if (!dayMatch) return;
  const dayName = dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1);
  titleEl.textContent = `${dayName}'s Schedule`;
  
  const urlParams = new URLSearchParams(window.location.search);
  const dateParam = urlParams.get('date');
  let dayDate;
  if (dateParam) {
    dayDate = new Date(dateParam);
  } else {
    const now = new Date();
    const currentDayOfWeek = now.getDay();
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
    const dayIndex = weekDays.indexOf(dayName);
    if (dayIndex === -1) return;
    dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + dayIndex);
  }
  
  const holidayName = getHolidayForDate(dayDate);
  if (holidayName) {
    scheduleEl.innerHTML = `<div class="noSchoolMessage"><h3>${holidayName}</h3><p>No school today!</p></div>`;
    return;
  }
  const schedules = getSchedules(dayDate);
  const schedule = schedules[dayName];
  const now = new Date();
  const isToday = dayName === currentDayName() && dayDate.toDateString() === now.toDateString();
  scheduleEl.innerHTML = renderScheduleTable(schedule, isToday ? minutesNow() : null, false);
}

function updateClock() {
  const clockDisplay = document.getElementById('clockDisplay');
  const clockLabel = document.getElementById('clockLabel');
  const timerEl = document.getElementById('timer');
  if (!clockDisplay || !clockLabel || !timerEl) return;
  const schedules = getSchedules(new Date());
  const today = schedules[currentDayName()];
  if (!today || today.length === 0) {
    const nextSchoolStartTime = getNextSchoolDayStartTime();
    if (nextSchoolStartTime) {
      const nowMillis = new Date().getTime();
      const diff = nextSchoolStartTime.getTime() - nowMillis;
      if (diff > 0) {
        const totalSeconds = Math.floor(diff / 1000);
        const s = totalSeconds % 60;
        const totalMinutes = Math.floor(totalSeconds / 60);
        const m = totalMinutes % 60;
        const totalHours = Math.floor(totalMinutes / 60);
        const h = totalHours % 24;
        const d = Math.floor(totalHours / 24);
        if (d > 1) displayTimeBlocks(clockDisplay, { days: d, hours: h, minutes: m, seconds: s });
        else if (h > 0) displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });
        else displayTimeBlocks(clockDisplay, { minutes: m, seconds: s });
        clockLabel.innerHTML = "UNTIL NEXT SCHOOL DAY";
        timerEl.innerHTML = `Next school day: ${nextSchoolStartTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
        timerEl.classList.remove('hidden');
      } else {
        displayMessage(clockDisplay, "See You Soon!");
        clockLabel.innerHTML = "SCHOOL IS OVER";
        timerEl.innerHTML = "See you at the next school day!";
        timerEl.classList.remove('hidden');
      }
    } else {
      displayMessage(clockDisplay, "Enjoy Your Break!");
      clockLabel.innerHTML = "SCHOOL'S OUT";
      timerEl.innerHTML = "Have a great break!";
      timerEl.classList.remove('hidden');
    }
    return;
  }
  const now = minutesNow();
  const secs = secondsNow();
  let current = null;
  let next = null;
  for (let i = 0; i < today.length; i++) {
    const p = today[i];
    if (now >= p.start && now < p.end) {
      current = p;
      next = today[i+1] || null;
    }
  }
  if (!current) {
    for (let i = 0; i < today.length-1; i++) {
      if (now >= today[i].end && now < today[i+1].start) {
        current = { name: "Passing Period", start: today[i].end, end: today[i+1].start };
        next = today[i+1];
        break;
      }
    }
  }
  if (current) {
    const remainingMinutes = current.end - now - 1;
    const remainingSeconds = 60 - secs;
    const h = Math.floor(remainingMinutes / 60);
    const m = remainingMinutes % 60;
    const s = remainingSeconds === 60 ? 0 : remainingSeconds;
    if (h > 0) displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });
    else displayTimeBlocks(clockDisplay, { minutes: m, seconds: s });
    clockLabel.innerHTML = `TIME REMAINING - ${current.name}`;
    const nextName = next ? `${next.name}<br>${format(next.start)} - ${format(next.end)}` : "School Day Complete";
    timerEl.innerHTML = `Current: <b>${current.name}</b><br>Next: ${nextName}`;
    timerEl.classList.remove('hidden');
  } else {
    const firstPeriod = today[0];
    const lastPeriod = today[today.length - 1];
    if (now < firstPeriod.start) {
      const remainingMinutes = firstPeriod.start - now - 1;
      const remainingSeconds = 60 - secs;
      const h = Math.floor(remainingMinutes / 60);
      const m = remainingMinutes % 60;
      const s = remainingSeconds === 60 ? 0 : remainingSeconds;
      if (h > 0) displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });
      else displayTimeBlocks(clockDisplay, { minutes: m, seconds: s });
      clockLabel.innerHTML = "UNTIL SCHOOL STARTS";
      timerEl.innerHTML = `Next: <b>${firstPeriod.name}</b><br>${format(firstPeriod.start)} - ${format(firstPeriod.end)}`;
      timerEl.classList.remove('hidden');
    } else if (now >= lastPeriod.end) {
      const nextSchoolStartTime = getNextSchoolDayStartTime();
      if (nextSchoolStartTime) {
        const nowMillis = new Date().getTime();
        const diff = nextSchoolStartTime.getTime() - nowMillis;
        if (diff > 0) {
          const totalSeconds = Math.floor(diff / 1000);
          const s = totalSeconds % 60;
          const totalMinutes = Math.floor(totalSeconds / 60);
          const m = totalMinutes % 60;
          const totalHours = Math.floor(totalMinutes / 60);
          const h = totalHours % 24;
          const d = Math.floor(totalHours / 24);
          if (d > 1) displayTimeBlocks(clockDisplay, { days: d, hours: h, minutes: m, seconds: s });
          else if (h > 0) displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });
          else displayTimeBlocks(clockDisplay, { minutes: m, seconds: s });
          clockLabel.innerHTML = "UNTIL NEXT SCHOOL DAY";
          timerEl.innerHTML = `Next school day: ${nextSchoolStartTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
          timerEl.classList.remove('hidden');
        } else {
          displayMessage(clockDisplay, "See You Soon!");
          clockLabel.innerHTML = "SCHOOL IS OVER";
          timerEl.innerHTML = "See you tomorrow!";
          timerEl.classList.remove('hidden');
        }
      } else {
        displayMessage(clockDisplay, "Enjoy Your Break!");
        clockLabel.innerHTML = "SCHOOL'S OUT";
        timerEl.innerHTML = "Have a great break!";
        timerEl.classList.remove('hidden');
      }
    } else {
      displayMessage(clockDisplay, "--:--:--");
      clockLabel.innerHTML = "NO PERIOD SCHEDULED";
      timerEl.classList.add('hidden');
    }
  }
}

function loadThemeOnPage() {
  const theme = localStorage.getItem('theme') || 'purple';
  const gradient = localStorage.getItem('gradient') || 'on';
  document.body.className = `theme-${theme}`;
  if (gradient === 'on') document.body.classList.add('gradient-mode');
}

function initApp() {
  loadThemeOnPage();
  loadLunchPreferences();
  if (document.getElementById('digitalClock')) {
    updateClock();
    setInterval(updateClock, 1000);
  }
  if (document.getElementById('todayContent')) {
    updateTodaySchedule();
    setInterval(updateTodaySchedule, 1000);
  }
  if (document.getElementById('dayContent')) {
    updateDaySchedule();
    setInterval(updateDaySchedule, 1000);
  }
  if (document.getElementById('weekContent')) {
    updateWeekSchedule();
  }
  if (document.getElementById('holidayCountdown')) {
    updateHolidayCountdown();
    setInterval(updateHolidayCountdown, 1000);
  }
  if (document.getElementById('holidayTableBody')) {
    updateHolidayTable();
  }
  if (document.getElementById('quartersList')) {
    updateQuartersAndSemesters();
    if (quartersInterval) clearInterval(quartersInterval);
    quartersInterval = setInterval(updateQuartersAndSemesters, 1000);
  }
}

initApp();