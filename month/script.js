const now = new Date();
let currentMonth = now.getMonth();
let currentYear = now.getFullYear();

if (currentYear < 2025 || (currentYear === 2025 && currentMonth < 10)) {
  currentMonth = 10;
  currentYear = 2025;
}

function renderCalendar() {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  document.getElementById('currentMonthYear').textContent = `${monthNames[currentMonth]} ${currentYear}`;
  
  const prevBtn = document.getElementById('prevMonth');
  const nextBtn = document.getElementById('nextMonth');
  
  prevBtn.disabled = (currentYear === 2025 && currentMonth === 10);
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
  
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
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
  
  if (dayName === 'Saturday' || dayName === 'Sunday') {
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
        
        if (isThanksgivingWeek(date)) {
          cell.classList.add('half-day');
        }
      } else {
        daySchedule.textContent = '';
        cell.classList.add('holiday');
      }
    }
  }
  
  cell.appendChild(dayNumber);
  cell.appendChild(daySchedule);
  return cell;
}

function isThanksgivingWeek(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return year === 2025 && month === 10 && day >= 24 && day <= 26;
}

document.getElementById('prevMonth').addEventListener('click', () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  if (currentYear < 2025 || (currentYear === 2025 && currentMonth < 10)) {
    currentMonth = 10;
    currentYear = 2025;
  }
  renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  if (currentYear > 2026 || (currentYear === 2026 && currentMonth > 5)) {
    currentMonth = 5;
    currentYear = 2026;
  }
  renderCalendar();
});

renderCalendar();