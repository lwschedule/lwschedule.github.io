const content = document.getElementById('normalScheduleContent');
const normalDate = new Date(2025, 9, 1);
const schedules = getSchedules(normalDate);
const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

let html = '';
weekDays.forEach(day => {
  html += `<h3 style="color: var(--primary-light); margin-top: 30px;">${day}</h3>`;
  html += renderScheduleTable(schedules[day], null, true);
});

content.innerHTML = html;