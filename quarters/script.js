// Quarters page functionality

let quartersInterval = null;

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

function initPage() {
  checkSetupComplete();
  loadThemeOnPage();
  loadLunchPreferences();
  updateQuartersAndSemesters();
  if (quartersInterval) clearInterval(quartersInterval);
  quartersInterval = setInterval(updateQuartersAndSemesters, 1000);
}

initPage();