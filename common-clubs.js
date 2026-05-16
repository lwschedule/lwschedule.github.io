// Clubs data filtering and rendering

function isClubsEnabled() {
return safeLocalStorageGet('clubsEnabled') === 'true';
}

function getSelectedClubs() {
try {
const saved = safeLocalStorageGet('selectedClubs');
return saved ? JSON.parse(saved) : [];
} catch (e) {
return [];
}
}

function isLastWeekdayOfMonth(date, dayName) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
  const targetDay = dayMap[dayName];
  
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  
  for (let d = lastDayOfMonth; d >= 1; d--) {
    const checkDate = new Date(year, month, d);
    if (checkDate.getDay() === targetDay) {
      return day === d;
    }
  }
  return false;
}

function isFirstWeekdayOfMonth(date, dayName) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
  const targetDay = dayMap[dayName];
  
  for (let d = 1; d <= 7; d++) {
    const checkDate = new Date(year, month, d);
    if (checkDate && checkDate.getDay() === targetDay) {
      return day === d;
    }
  }
  return false;
}

function isEvenWeek(date) {
  const tempDate = new Date(date.getTime());
  tempDate.setHours(0, 0, 0, 0);
  
  const yearStart = new Date(tempDate.getFullYear(), 0, 1);
  yearStart.setHours(0, 0, 0, 0);
  
  const dayOfYear = Math.floor((tempDate - yearStart) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((dayOfYear + yearStart.getDay() + 1) / 7);
  
  return weekNumber % 2 === 0;
}

function doesClubMeetOnDate(club, date) {
  const dayName = getDayNameFromDate(date);
  
  if (!club.days || !club.days.includes(dayName)) return false;
  
  const frequency = club.frequency || 'weekly';
  
  switch (frequency) {
    case 'weekly':
      return true;
      
    case 'every-other':
      return isEvenWeek(date);
      
    case 'biweekly':
      return isEvenWeek(date);
      
    case 'alternating':
      return isEvenWeek(date);
      
    case 'monthly':
      return isFirstWeekdayOfMonth(date, dayName);
      
    case 'last-of-month':
      return isLastWeekdayOfMonth(date, dayName);
      
    default:
      return true;
  }
}

function getClubsForDate(date) {
  if (!clubsData || !clubsData.clubs || !isClubsEnabled()) return [];
  
  const selectedClubIds = getSelectedClubs();
  if (selectedClubIds.length === 0) return [];
  
  const dayName = getDayNameFromDate(date);
  
  return clubsData.clubs.filter(club => {
    if (!selectedClubIds.includes(club.id)) return false;
    return doesClubMeetOnDate(club, date);
  }).map(club => {
    return {
      ...club,
      startMinutes: club.startHour * 60 + club.startMinute,
      endMinutes: club.endHour * 60 + club.endMinute
    };
  }).sort((a, b) => a.startMinutes - b.startMinutes);
}

function formatClubTime(club) {
  const formatTime = (h, m) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };
  return `${formatTime(club.startHour, club.startMinute)} - ${formatTime(club.endHour, club.endMinute)}`;
}

function renderClubsForDay(date, showHeader = true) {
  const clubs = getClubsForDate(date);
  if (clubs.length === 0) return '';
  
  let html = '';
  if (showHeader) {
    html += '<div class="clubsSection"><h3>My Clubs</h3>';
  }
  html += '<table class="scheduleTable clubsTable"><thead><tr><th>Club</th><th>Time</th><th>Room</th></tr></thead><tbody>';
  
  clubs.forEach(club => {
    html += `<tr><td>${club.name}</td><td>${formatClubTime(club)}</td><td>${club.room}</td></tr>`;
  });
  
  html += '</tbody></table>';
  if (showHeader) html += '</div>';
  
  return html;
}

function getClubTimeRange(club) {
  if (!club) return null;
  return {
    startMinutes: club.startMinutes ?? (club.startHour * 60 + club.startMinute),
    endMinutes: club.endMinutes ?? (club.endHour * 60 + club.endMinute)
  };
}

function renderClubCountdown(club, activeClub) {
  if (!club || !activeClub || club.id !== activeClub.id) {
    return '';
  }

  const clubTimeRange = getClubTimeRange(activeClub);
  if (!clubTimeRange) return '';

  const now = new Date();
  const clubEndTime = new Date(now);
  clubEndTime.setHours(Math.floor(clubTimeRange.endMinutes / 60), clubTimeRange.endMinutes % 60, 0, 0);

  const totalSeconds = Math.max(0, Math.floor((clubEndTime.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  parts.push(`${seconds.toString().padStart(2, '0')}s`);
  const statusText = `Ends in ${parts.join(' ')}`;

  const roomText = activeClub.room && String(activeClub.room).trim() ? activeClub.room : 'TBD';

  return `<div class="clubCountdownSection">
    <div class="clubCountdownHeading">Active Club</div>
    <div class="clubCountdownName">${activeClub.name}</div>
    <div class="clubCountdownMeta">
      <span class="clubCountdownRoom">Room ${roomText}</span>
      <span class="clubCountdownTime">${formatClubTime(activeClub)}</span>
    </div>
    <div class="clubCountdownStatus">${statusText}</div>
  </div>`;
}
