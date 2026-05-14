// Homepage countdown clock, timer, and club overlap integration

let lastNextPeriodText = null;

function displayTimeBlocks(container, data) {
  const daysNf = document.getElementById('clock-days');
  const hoursNf = document.getElementById('clock-hours');
  const minutesNf = document.getElementById('clock-minutes');
  const secondsNf = document.getElementById('clock-seconds');
  const daysBlock = document.getElementById('clockDisplay-days-block');
  const hoursBlock = document.getElementById('clockDisplay-hours-block');

  const showDays = (data.days && data.days > 0);
  const showHours = (data.hours !== undefined && (showDays || data.hours > 0));

  if (daysBlock) daysBlock.style.display = showDays ? 'block' : 'none';
  if (hoursBlock) hoursBlock.style.display = showHours ? 'block' : 'none';

  if (daysNf && typeof daysNf.update === 'function' && document.body.classList.contains('homePage')) {
    daysNf.update(data.days || 0);
    hoursNf?.update(data.hours ?? 0);
    minutesNf?.update(data.minutes);
    secondsNf?.update(data.seconds);
    return;
  }

  if (daysNf) daysNf.textContent = data.days ? data.days.toString().padStart(2,'0') : '00';
  if (hoursNf) hoursNf.textContent = data.hours !== undefined ? data.hours.toString().padStart(2,'0') : '00';
  if (minutesNf) minutesNf.textContent = data.minutes.toString().padStart(2,'0');
  if (secondsNf) secondsNf.textContent = data.seconds.toString().padStart(2,'0');
}

function displayMessage(container, message) {
  container.innerHTML = `<div class="time-block" style="grid-column: 1/-1;"><span class="time-value" style="font-size: 1.5em;">${message}</span></div>`;
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

let timerMorph = null;

function ensureTimerMorphHost(timerEl) {
  if (!timerEl) return null;
  let host = timerEl.querySelector('.timer-value-morph');
  if (!host) {
    host = document.createElement('span');
    host.className = 'timer-value-morph';
    timerEl.textContent = '';
    timerEl.appendChild(host);
  }
  return host;
}

async function initTimerMorph() {
  const timerEl = document.getElementById('timer');
  if (!timerEl) return;

  try {
    if (getTorphWorkaroundNeeded && getTorphWorkaroundNeeded()) {
      window.updateNextPeriodBlock = null;
      console.warn('Torph disabled on iOS < 17; using text updates.');
      return;
    }

    const { TextMorph } = await import('/vendor/torph.js');
    const host = ensureTimerMorphHost(timerEl);
    if (!host) return;
    timerMorph = new TextMorph({ element: host });
    window.updateNextPeriodBlock = (text) => {
      timerMorph.update(text);
    };
  } catch (error) {
    window.updateNextPeriodBlock = null;
    console.warn('Torph failed to load for next period block, using default updates.', error);
  }
}

function getClubMinutesNow() {
  const d = new Date();
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

function updateClock() {
  try {
    const shouldRefreshToday = Boolean(document.getElementById('todayContent'));
    const { nowDate, weekday, minutes: now, seconds: secs } = getNowParts();
    const clockDisplay = document.getElementById('clockDisplay');
    const clockLabel = document.getElementById('clockLabel');
    const timerEl = document.getElementById('timer');
    if (!clockDisplay || !clockLabel || !timerEl) {
      if (shouldRefreshToday && typeof updateTodaySchedule === 'function') updateTodaySchedule();
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
  const activeClub = getActiveClubForDay(nowDate);
  const clubsToday = getClubsForDate(nowDate);

  // CLUB OVERRIDE: active club overlapping current period → club takes priority
  if (currentPeriod && activeClub && clubOverlapsPeriod(activeClub, currentPeriod)) {
    const clubTime = getClubTimeRange(activeClub);
    const remainingMinutes = clubTime.endMinutes - now - 1;
    const totalSeconds = Math.max(0, remainingMinutes * 60 + (59 - secs));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    clockLabel.textContent = activeClub.name.toUpperCase();
    displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });

    const room = (activeClub.room && String(activeClub.room).trim()) || 'TBD';
    updateNextPeriodText(timerEl, `In Club: ${activeClub.name} · Room ${room}`);

    if (shouldRefreshToday && typeof updateTodaySchedule === 'function') updateTodaySchedule();
    return;
  }

  const nextClub = clubsToday.find(c => (c.startHour * 60 + c.startMinute) > now);

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
    // Active morning club before school
    if (activeClub) {
      const clubTime = getClubTimeRange(activeClub);
      const remainingMinutes = clubTime.endMinutes - now - 1;
      const totalSeconds = Math.max(0, remainingMinutes * 60 + (59 - secs));
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      clockLabel.textContent = activeClub.name.toUpperCase();
      displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });

      const room = (activeClub.room && String(activeClub.room).trim()) || 'TBD';
      updateNextPeriodText(timerEl, `In Club: ${activeClub.name} · Room ${room}`);
    } else if (nextClub && (nextClub.startHour * 60 + nextClub.startMinute) < today[0].start) {
      const diffMinutes = (nextClub.startHour * 60 + nextClub.startMinute) - now;
      const totalSeconds = Math.max(0, diffMinutes * 60 + (59 - secs));
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      clockLabel.textContent = `UNTIL ${nextClub.name.toUpperCase()}`;
      displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });
      updateNextPeriodText(timerEl, `Next: ${nextClub.name} · Room ${(nextClub.room && String(nextClub.room).trim()) || 'TBD'}`);
    } else {
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
    }
  } else if (now > today[today.length - 1].end) {
    // After-school active club override
    if (activeClub) {
      const clubTime = getClubTimeRange(activeClub);
      const remainingMinutes = clubTime.endMinutes - now - 1;
      const totalSeconds = Math.max(0, remainingMinutes * 60 + (59 - secs));
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      clockLabel.textContent = activeClub.name.toUpperCase();
      displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });

      const room = (activeClub.room && String(activeClub.room).trim()) || 'TBD';
      updateNextPeriodText(timerEl, `In Club: ${activeClub.name} · Room ${room}`);
    } else if (nextClub) {
      const diffMinutes = (nextClub.startHour * 60 + nextClub.startMinute) - now;
      const totalSeconds = Math.max(0, diffMinutes * 60 + (59 - secs));
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      clockLabel.textContent = `UNTIL ${nextClub.name.toUpperCase()}`;
      displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });
      updateNextPeriodText(timerEl, `Next: ${nextClub.name} · Room ${(nextClub.room && String(nextClub.room).trim()) || 'TBD'}`);
    } else {
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
    }
  } else {
    const nextPeriod = getNextPeriodStart(today, now);
    // Active club between periods (e.g., during passing period)
    if (activeClub) {
      const clubTime = getClubTimeRange(activeClub);
      const remainingMinutes = clubTime.endMinutes - now - 1;
      const totalSeconds = Math.max(0, remainingMinutes * 60 + (59 - secs));
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      clockLabel.textContent = activeClub.name.toUpperCase();
      displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });

      const room = (activeClub.room && String(activeClub.room).trim()) || 'TBD';
      updateNextPeriodText(timerEl, `In Club: ${activeClub.name} · Room ${room}`);
    } else if (nextClub && nextPeriod && (nextClub.startHour * 60 + nextClub.startMinute) < nextPeriod.start) {
      const diffMinutes = (nextClub.startHour * 60 + nextClub.startMinute) - now;
      const totalSeconds = Math.max(0, diffMinutes * 60 + (59 - secs));
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      clockLabel.textContent = `UNTIL ${nextClub.name.toUpperCase()}`;
      displayTimeBlocks(clockDisplay, { hours: h, minutes: m, seconds: s });
      updateNextPeriodText(timerEl, `Next: ${nextClub.name} · Room ${(nextClub.room && String(nextClub.room).trim()) || 'TBD'}`);
    } else if (nextPeriod) {
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

  if (shouldRefreshToday && typeof updateTodaySchedule === 'function') updateTodaySchedule();
  } catch (e) {
    console.warn('updateClock error:', e);
  }
}
