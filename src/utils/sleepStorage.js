const STORAGE_KEY = 'circathym_sleep_log';
const MAX_ENTRIES = 30;

export function logSleep({ bedtime, waketime, rating }) {
  const log = getSleepLog();
  log.push({
    bedtime: bedtime instanceof Date ? bedtime.toISOString() : bedtime,
    waketime: waketime instanceof Date ? waketime.toISOString() : waketime,
    rating,
    ts: Date.now(),
  });
  if (log.length > MAX_ENTRIES) log.splice(0, log.length - MAX_ENTRIES);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(log)); } catch (e) {}
}

export function setSleepLog(entries) {
  const clean = entries
    .filter((entry) => entry && entry.bedtime && entry.waketime && entry.rating)
    .slice(-MAX_ENTRIES)
    .map((entry) => ({
      ...entry,
      bedtime: entry.bedtime instanceof Date ? entry.bedtime.toISOString() : entry.bedtime,
      waketime: entry.waketime instanceof Date ? entry.waketime.toISOString() : entry.waketime,
      ts: entry.ts || Date.now(),
    }));

  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(clean)); } catch (e) {}
  return clean;
}

/*
  Demo data engineered to produce a 94-minute personal cycle.

  derivePersonalCycleLength logic:
    good wakes (rating ≥ 4) durations: 562, 566, 564, 560, 568, 562
    average = 563.67 min
    cycles  = round(563.67 / 90) = 6
    result  = round(563.67 / 6)  = 94 ✓

  Comparison at 7:15 AM (bedtime 11 pm, after 15m onset = 480 min asleep):
    90m  → 30m from nearest boundary (6:45 am)  → Acceptable / AMBER
    94m  → 10m from nearest boundary (7:05 am)  → Optimal   / GREEN
*/
export function createDemoSleepLog(now = new Date()) {
  const specs = [
    { daysAgo: 8, bedtime: '23:00', durationMin: 562, rating: 5 },
    { daysAgo: 7, bedtime: '23:10', durationMin: 566, rating: 4 },
    { daysAgo: 6, bedtime: '23:30', durationMin: 510, rating: 3 },
    { daysAgo: 5, bedtime: '22:50', durationMin: 564, rating: 5 },
    { daysAgo: 4, bedtime: '23:15', durationMin: 560, rating: 4 },
    { daysAgo: 3, bedtime: '00:04', durationMin: 380, rating: 2 },
    { daysAgo: 2, bedtime: '23:05', durationMin: 568, rating: 5 },
    { daysAgo: 1, bedtime: '23:08', durationMin: 562, rating: 4 },
  ];

  return specs.map((item, index) => {
    const [hour, minute] = item.bedtime.split(':').map(Number);
    const bed = new Date(now);
    bed.setDate(now.getDate() - item.daysAgo);
    bed.setHours(hour, minute, 0, 0);
    const wake = new Date(bed.getTime() + item.durationMin * 60000);
    return {
      bedtime: bed.toISOString(),
      waketime: wake.toISOString(),
      rating: item.rating,
      ts: now.getTime() - (specs.length - index) * 86400000,
      demo: true,
    };
  });
}

export function getSleepLog() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export function clearSleepLog() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}
