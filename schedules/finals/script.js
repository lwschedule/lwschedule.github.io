const content = document.getElementById('finalsScheduleContent');
const finalsDate = new Date(2026, 0, 20);
const schedules = getSchedules(finalsDate);
const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

let html = '';
weekDays.forEach(day => {
  html += `<h3 style="color: var(--primary-light); margin-top: 30px;">${day}</h3>`;
  const schedule = schedules[day];
  if (!schedule || schedule.length === 0) {
    html += '<p style="text-align: center; opacity: 0.8;">No School</p>';
  } else {
    html += renderScheduleTable(schedule, null, true);
  }
});

content.innerHTML = html;