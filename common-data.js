// Data loading, caching, and app initialization

let lunchPreferences = null;
let holidays = null;
let schedulesData = null;
let academicTerms = null;
let clubsData = null;

const DATA_VERSION = '2.2';
const DATA_CACHE_KEY = 'lw:dataCache';
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;
let runtimeDataCache = null;
const inFlightFetches = {};

function readDataCache() {
  try {
    const raw = sessionStorage.getItem(DATA_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeDataCache(obj) {
  try {
    sessionStorage.setItem(DATA_CACHE_KEY, JSON.stringify(obj));
  } catch (e) {
  }
}

function clearDataCache() {
  try {
    sessionStorage.removeItem(DATA_CACHE_KEY);
  } catch (e) {
  }
  runtimeDataCache = null;
}

function clearCachedData() {
  clearDataCache();
}

try { window.clearCachedData = clearCachedData; window.getDataCache = readDataCache; } catch (e) { }

function getDefaultLunchPrefs() {
  return { Monday: 'A', Tuesday: 'A', Wednesday: 'All', Thursday: 'A', Friday: 'A' };
}

function loadLunchPreferences() {
  try {
    const saved = localStorage.getItem('lunchPreferences');
    if (saved) lunchPreferences = JSON.parse(saved);
  } catch (e) {}
}

async function loadData(neededFiles = ['schedules', 'holidays', 'terms', 'clubs']) {
  const fileMap = {
    schedules: {
      url: '/data/schedules.json',
      assign: async (json) => {
        schedulesData = json;
        lunchPreferences = schedulesData.lunchPreferences || (typeof getDefaultLunchPrefs === 'function' ? getDefaultLunchPrefs() : { Monday: 'A', Tuesday: 'A', Wednesday: 'All', Thursday: 'A', Friday: 'A' });
        if (typeof loadLunchPreferences === 'function') loadLunchPreferences();
      }
    },
    holidays: {
      url: '/data/holidays.json',
      assign: async (json) => { holidays = json.map(h => ({ ...h, date: new Date(h.date) })); }
    },
    terms: {
      url: '/data/terms.json',
      assign: async (json) => {
        academicTerms = json;
        academicTerms.quarters = (academicTerms.quarters || []).map(q => {
          const [startYear, startMonth, startDay] = q.start.split('-').map(Number);
          const [endYear, endMonth, endDay] = q.end.split('-').map(Number);
          return { ...q, start: new Date(startYear, startMonth - 1, startDay), end: new Date(endYear, endMonth - 1, endDay) };
        });
        academicTerms.semesters = (academicTerms.semesters || []).map(s => {
          const [startYear, startMonth, startDay] = s.start.split('-').map(Number);
          const [endYear, endMonth, endDay] = s.end.split('-').map(Number);
          return { ...s, start: new Date(startYear, startMonth - 1, startDay), end: new Date(endYear, endMonth - 1, endDay) };
        });
      }
    },
    clubs: {
      url: '/data/clubs.json',
      assign: async (json) => { clubsData = json; }
    }
  };

  try {
    const cached = readDataCache();
    if (cached && cached.version === DATA_VERSION) {
      runtimeDataCache = cached;
    } else if (cached && cached.version !== DATA_VERSION) {
      clearDataCache();
      runtimeDataCache = { version: DATA_VERSION, files: {} };
    } else if (!cached) {
      runtimeDataCache = { version: DATA_VERSION, files: {} };
    }
  } catch (e) {
    runtimeDataCache = { version: DATA_VERSION, files: {} };
  }

  const cachedFiles = (runtimeDataCache && runtimeDataCache.files) ? runtimeDataCache.files : {};

  function fetchWithGuard(key, url) {
    if (inFlightFetches[key]) return inFlightFetches[key];
    const p = fetch(url).then(res => {
      if (!res.ok) throw new Error('Network response not ok');
      return res.json();
    }).finally(() => { delete inFlightFetches[key]; });
    inFlightFetches[key] = p;
    return p;
  }

  const toFetch = [];
  for (const k of neededFiles) {
    if (!fileMap[k]) continue;
    const entry = cachedFiles[k];
    let cachedJson = null;
    let isFresh = false;
    if (entry !== undefined && entry !== null) {
      if (entry && entry.data !== undefined) {
        cachedJson = entry.data;
        if (typeof entry.ts === 'number') {
          if ((Date.now() - entry.ts) <= MAX_CACHE_AGE_MS) isFresh = true;
        } else {
          isFresh = true;
        }
      } else {
        cachedJson = entry;
        isFresh = true;
      }
    }

    if (isFresh && cachedJson !== null) {
      try {
        await fileMap[k].assign(cachedJson);
        continue;
      } catch (e) {
        console.warn('Failed to assign cached data for', k, e);
      }
    }
    toFetch.push({ key: k, url: fileMap[k].url });
  }

  try {
    const fetchPromises = toFetch.map(t => fetchWithGuard(t.key, t.url).then(json => ({ key: t.key, json })).catch(err => ({ key: t.key, err })));
    const fetchResults = await Promise.all(fetchPromises);
    for (const r of fetchResults) {
      if (r.err) {
        console.warn('Fetch failed for', r.key, r.err);
        continue;
      }
      try {
        const json = r.json;
        cachedFiles[r.key] = { data: json, ts: Date.now() };
        await fileMap[r.key].assign(json);
      } catch (e) {
        console.warn('Failed to parse or assign', r.key, e);
      }
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }

  try {
    runtimeDataCache.files = cachedFiles;
    writeDataCache(runtimeDataCache);
  } catch (e) {
  }

  if (!schedulesData) {
    schedulesData = { normal: {}, finals: {}, lunchPreferences: getDefaultLunchPrefs() };
  }
  if (!lunchPreferences) lunchPreferences = schedulesData.lunchPreferences || getDefaultLunchPrefs();
  if (!holidays) holidays = [];
  if (!academicTerms) academicTerms = { quarters: [], semesters: [] };
  if (!clubsData) clubsData = { clubs: [] };
}

async function initApp(options = {}) {
  const currentVersion = localStorage.getItem('dataVersion');
  if (currentVersion !== DATA_VERSION) {
    localStorage.setItem('dataVersion', DATA_VERSION);
    try { clearDataCache(); } catch (e) { }
  }
  
  await loadData(options.neededFiles);
  
  const now = new Date();
  const sem2Start = new Date(2026, 0, 24); 
  if (now >= sem2Start && !localStorage.getItem('sem2ResetDone')) {
    localStorage.setItem('lunchPreferences', JSON.stringify({Monday:'A',Tuesday:'A',Wednesday:'All',Thursday:'A',Friday:'A'}));
    localStorage.setItem('sem2ResetDone', 'true');
  }
  
  if (typeof loadLunchPreferences === 'function') loadLunchPreferences();

  if (typeof updateHolidayCountdown === 'function' && document.getElementById('holidayCountdown')) {
    updateHolidayCountdown();
    setInterval(updateHolidayCountdown, 1000);
  }
  if (typeof updateHolidayTable === 'function' && document.getElementById('holidayTableBody')) {
    updateHolidayTable();
  }
  
  if (typeof initPackUpNotifications === 'function') {
    initPackUpNotifications();
  }
}
