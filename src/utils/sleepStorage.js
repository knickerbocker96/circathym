const STORAGE_KEY = 'circathym_sleep_log';
const MAX_ENTRIES = 30;

export function getSleepLog() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export function logSleep({ bedtime, waketime, rating }) {
  const log = getSleepLog();

  log.push({
    bedtime: bedtime instanceof Date ? bedtime.toISOString() : bedtime,
    waketime: waketime instanceof Date ? waketime.toISOString() : waketime,
    rating,
    ts: Date.now(),
  });

  if (log.length > MAX_ENTRIES) {
    log.splice(0, log.length - MAX_ENTRIES);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch (e) {}

  return log;
}

export function clearSleepLog() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}
