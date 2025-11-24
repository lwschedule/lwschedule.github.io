// Shared utilities used across multiple pages
// Only genuinely reusable code goes here

// Lunch preferences
let lunchPreferences = {
  Monday: 'A',
  Tuesday: 'A',
  Wednesday: 'All',
  Thursday: 'A',
  Friday: 'A'
};

// Holidays data
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

// Academic terms
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

function loadThemeOnPage() {
  const theme = localStorage.getItem('theme') || 'purple';
  const gradient = localStorage.getItem('gradient') || 'on';
  document.body.className = `theme-${theme}`;
  if (gradient === 'on') document.body.classList.add('gradient-mode');
}

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

function renderScheduleTable(schedule, now, showDuration = false) {
  if (!schedule || schedule.length === 0) {
    const funMessages = ["Have fun!", "Go outside!", "Relax and recharge!", "Enjoy your free time!", "Make it a great day!", "Time to unwind!", "Do something you love!", "Rest up for tomorrow!", "Adventure awaits!", "Explore something new!"];
    const message = funMessages[Math.floor(Math.random() * funMessages.length)];
    return `<div class="noSchoolMessage"><h3>No School</h3><p>${message}</p></div>`;
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