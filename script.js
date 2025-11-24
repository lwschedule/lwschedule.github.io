// Home page specific functionality

function minutesNow() {
    const d = new Date();
    return d.getHours()*60 + d.getMinutes();
  }
  
  function secondsNow() {
    return new Date().getSeconds();
  }
  
  function displayTimeBlocks(container, data) {
    let html = '';
    if (data.days !== undefined) {
      const daysId = container.id ? container.id.replace('Display', '') + '-days' : '';
      html += `<div class="time-block"><span id="${daysId}" class="time-value">${data.days}</span><span class="time-label">${data.days === 1 ? 'DAY' : 'DAYS'}</span></div>`;
    }
    if (data.hours !== undefined) {
      const hoursId = container.id ? container.id.replace('Display', '') + '-hours' : '';
      html += `<div class="time-block"><span id="${hoursId}" class="time-value">${data.hours.toString().padStart(2, '0')}</span><span class="time-label">${data.hours === 1 ? 'HOUR' : 'HOURS'}</span></div>`;
    }
    const minutesId = container.id ? container.id.replace('Display', '') + '-minutes' : '';
    const secondsId = container.id ? container.id.replace('Display', '') + '-seconds' : '';
    html += `<div class="time-block"><span id="${minutesId}" class="time-value">${data.minutes.toString().padStart(2, '0')}</span><span class="time-label">MINUTES</span></div>`;
    html += `<div class="time-block"><span id="${secondsId}" class="time-value">${data.seconds.toString().padStart(2, '0')}</span><span class="time-label">SECONDS</span></div>`;
    container.innerHTML = html;
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
  
  function updateClock() {
    const clockDisplay = document.getElementById('clockDisplay');
    const clockLabel = document.getElementById('clockLabel');
    const timerEl = document.getElementById('timer');
    if (!clockDisplay || !clockLabel || !timerEl) return;
    
    const schedules = getSchedules(new Date());
    const today = schedules[getDayNameFromDate(new Date())];
    
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
          if (d > 0) {
            displayTimeBlocks(clockDisplay, { days: d, hours: h, minutes: m, seconds: s });
            updateRollingText(document.getElementById('clockDisplay-days'), d.toString());
            updateRollingText(document.getElementById('clockDisplay-hours'), h.toString().padStart(2,'0'));
            updateRollingText(document.getElementById('clockDisplay-minutes'), m.toString().padStart(2,'0'));
            updateRollingText(document.getElementById('clockDisplay-seconds'), s.toString().padStart(2,'0'));
          } else if (h > 0) {
            displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });
            updateRollingText(document.getElementById('clockDisplay-hours'), h.toString().padStart(2,'0'));
            updateRollingText(document.getElementById('clockDisplay-minutes'), m.toString().padStart(2,'0'));
            updateRollingText(document.getElementById('clockDisplay-seconds'), s.toString().padStart(2,'0'));
          } else {
            displayTimeBlocks(clockDisplay, { minutes: m, seconds: s });
            updateRollingText(document.getElementById('clockDisplay-minutes'), m.toString().padStart(2,'0'));
            updateRollingText(document.getElementById('clockDisplay-seconds'), s.toString().padStart(2,'0'));
          }
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
      if (h > 0) {
        displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });
        updateRollingText(document.getElementById('clockDisplay-hours'), h.toString().padStart(2,'0'));
        updateRollingText(document.getElementById('clockDisplay-minutes'), m.toString().padStart(2,'0'));
        updateRollingText(document.getElementById('clockDisplay-seconds'), s.toString().padStart(2,'0'));
      } else {
        displayTimeBlocks(clockDisplay, { minutes: m, seconds: s });
        updateRollingText(document.getElementById('clockDisplay-minutes'), m.toString().padStart(2,'0'));
        updateRollingText(document.getElementById('clockDisplay-seconds'), s.toString().padStart(2,'0'));
      }
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
        if (h > 0) {
          displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });
          updateRollingText(document.getElementById('clockDisplay-hours'), h.toString().padStart(2,'0'));
          updateRollingText(document.getElementById('clockDisplay-minutes'), m.toString().padStart(2,'0'));
          updateRollingText(document.getElementById('clockDisplay-seconds'), s.toString().padStart(2,'0'));
        } else {
          displayTimeBlocks(clockDisplay, { minutes: m, seconds: s });
          updateRollingText(document.getElementById('clockDisplay-minutes'), m.toString().padStart(2,'0'));
          updateRollingText(document.getElementById('clockDisplay-seconds'), s.toString().padStart(2,'0'));
        }
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
            if (d > 0) {
              displayTimeBlocks(clockDisplay, { days: d, hours: h, minutes: m, seconds: s });
              updateRollingText(document.getElementById('clockDisplay-days'), d.toString());
              updateRollingText(document.getElementById('clockDisplay-hours'), h.toString().padStart(2,'0'));
              updateRollingText(document.getElementById('clockDisplay-minutes'), m.toString().padStart(2,'0'));
              updateRollingText(document.getElementById('clockDisplay-seconds'), s.toString().padStart(2,'0'));
            } else if (h > 0) {
              displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });
              updateRollingText(document.getElementById('clockDisplay-hours'), h.toString().padStart(2,'0'));
              updateRollingText(document.getElementById('clockDisplay-minutes'), m.toString().padStart(2,'0'));
              updateRollingText(document.getElementById('clockDisplay-seconds'), s.toString().padStart(2,'0'));
            } else {
              displayTimeBlocks(clockDisplay, { minutes: m, seconds: s });
              updateRollingText(document.getElementById('clockDisplay-minutes'), m.toString().padStart(2,'0'));
              updateRollingText(document.getElementById('clockDisplay-seconds'), s.toString().padStart(2,'0'));
            }
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
  
  function initApp() {
    checkSetupComplete();
    loadThemeOnPage();
    loadLunchPreferences();
    updateClock();
    setInterval(updateClock, 1000);
  }
  
  initApp();