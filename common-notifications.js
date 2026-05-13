// Pack-up and phone caddy notifications

function initPackUpNotifications() {
  if ('Notification' in window && localStorage.getItem('notifications-enabled') === 'true') {
    if (Notification.permission === 'granted') {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => { startPackUpMonitoring(); }, { timeout: 3000 });
      } else {
        setTimeout(() => { startPackUpMonitoring(); }, 500);
      }
    }
  }
}

function startPackUpMonitoring() {
  if (window.packUpInterval) {
    clearInterval(window.packUpInterval);
  }
  
  window.packUpInterval = setInterval(() => {
    checkPackUpTime();
    checkPhoneCaddyTime();
  }, 60000); 
  
  checkPackUpTime();
  checkPhoneCaddyTime();
}

function checkPhoneCaddyTime() {
  const now = new Date();
  if (localStorage.getItem('notifications-enabled') !== 'true') return;
  const caddyEnabled = localStorage.getItem('phone-caddy-enabled') === 'true';
  if (!caddyEnabled) return;

  const dayOfWeek = now.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return;
  
  const holiday = getHolidayForDate(now);
  if (holiday) return;

  const schedules = getSchedules(now);
  const todayName = getDayNameFromDate(now);
  const todaySchedule = schedules[todayName];
  
  if (!todaySchedule || todaySchedule.length === 0) return;

  const caddyTimes = JSON.parse(localStorage.getItem('phone-caddy-times') || '{}');
  for (let i = 0; i < todaySchedule.length; i++) {
    const period = todaySchedule[i];
    
    let periodNumMatch = period.name.match(/Period\s*(\d)/i);
    if (!periodNumMatch) continue;
    let periodNum = periodNumMatch[1];
    
    let assignedSpot = caddyTimes[periodNum];
    if (!assignedSpot || assignedSpot.trim() === '') continue;

    const periodStartTime = new Date(now);
    periodStartTime.setHours(0, period.start, 0, 0);

    const periodEndTime = new Date(now);
    periodEndTime.setHours(0, period.end, 0, 0);

    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const notifStartMins = (periodStartTime.getHours() * 60 + periodStartTime.getMinutes()) - 1;
    const notifEndMins = (periodEndTime.getHours() * 60 + periodEndTime.getMinutes()) - 1;

    if (nowMinutes === notifStartMins) {
      if (Notification.permission === 'granted') {
        sendNotification('Phone Caddy', {
          body: `Class starts in 1 minute! Put your phone in caddy spot #${assignedSpot}`,
          icon: '/icons/icon-192.png',
          tag: `caddy-start-${periodNum}`
        });
      }
    } else if (nowMinutes === notifEndMins) {
      if (Notification.permission === 'granted') {
        sendNotification('Phone Caddy', {
          body: `Class ends in 1 minute! Grab your phone from caddy spot #${assignedSpot}`,
          icon: '/icons/icon-192.png',
          tag: `caddy-end-${periodNum}`
        });
      }
    }
  }
}

function checkPackUpTime() {
  const now = new Date();
  const packUpTimeMinutes = parseInt(localStorage.getItem('pack-up-time') || '0', 10);
  
  if (packUpTimeMinutes <= 0) return;
  
  const dayOfWeek = now.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return;
  
  const holiday = getHolidayForDate(now);
  if (holiday) return;
  
  const schedules = getSchedules(now);
  const todayName = getDayNameFromDate(now);
  const todaySchedule = schedules[todayName];
  
  if (!todaySchedule || todaySchedule.length === 0) return;
  
  for (let i = 0; i < todaySchedule.length; i++) {
    const period = todaySchedule[i];
    const periodEndTime = new Date(now);
    periodEndTime.setHours(0, period.end, 0, 0);
    
    const notificationTime = new Date(periodEndTime);
    notificationTime.setMinutes(periodEndTime.getMinutes() - packUpTimeMinutes);
    
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const notificationMinutes = notificationTime.getHours() * 60 + notificationTime.getMinutes();
    
    if (nowMinutes === notificationMinutes) {
      showPackUpNotification(period);
      break; 
    }
  }
}

function showPackUpNotification(period) {
  if (Notification.permission !== 'granted') return;
  
  const packUpTimeMinutes = parseInt(localStorage.getItem('pack-up-time') || '0', 10);
  const todayName = getDayNameFromDate(new Date());
  
  sendNotification('Pack Up Time!', {
    body: `Time to pack up for ${period.name} in ${packUpTimeMinutes} minutes (${todayName})`,
    icon: '/icons/icon-192.png',
    tag: 'pack-up-reminder'
  });
}

async function sendNotification(title, options) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    } catch (e) { console.warn(e); }
  }
  const n = new Notification(title, options);
  n.onclick = function() { window.focus(); this.close(); };
  setTimeout(() => n.close(), 5000);
}
