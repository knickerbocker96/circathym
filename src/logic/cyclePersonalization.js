import { CYCLE_MIN } from './sleepCycle';

export function derivePersonalCycleLength(sleepLog) {
  const good = sleepLog.filter(e => e.rating >= 4);
  if (good.length < 3) return null;

  const durations = good.map(e => {
    const diffMin = (new Date(e.waketime) - new Date(e.bedtime)) / 60000;
    return diffMin;
  }).filter(d => d > 60 && d < 720); // sanity: 1h–12h

  if (durations.length < 3) return null;

  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const cycles = Math.round(avg / CYCLE_MIN);
  if (cycles < 1) return null;

  return Math.round(avg / cycles);
}

export function getCycleConfidence(sleepLog) {
  const good = sleepLog.filter(e => e.rating >= 4);
  if (good.length < 3) return { label: 'Low', score: good.length / 3, reason: 'needs 3 good wakes' };

  const estimates = good.map(e => {
    const diffMin = (new Date(e.waketime) - new Date(e.bedtime)) / 60000;
    const cycles = Math.max(1, Math.round(diffMin / CYCLE_MIN));
    return diffMin / cycles;
  }).filter(value => value > 70 && value < 125);

  if (estimates.length < 3) return { label: 'Low', score: 0.35, reason: 'not enough clean entries' };

  const avg = estimates.reduce((a, b) => a + b, 0) / estimates.length;
  const variance = estimates.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / estimates.length;
  const spread = Math.sqrt(variance);
  const volumeScore = Math.min(1, estimates.length / 8);
  const consistencyScore = Math.max(0, 1 - spread / 12);
  const score = Math.round((volumeScore * 0.45 + consistencyScore * 0.55) * 100) / 100;

  if (score >= 0.72) return { label: 'High', score, reason: `${estimates.length} aligned wakes` };
  if (score >= 0.48) return { label: 'Medium', score, reason: `${estimates.length} useful wakes` };
  return { label: 'Low', score, reason: 'wake times vary' };
}

export function getSleepDebt(sleepLog, targetHours = 8) {
  const recent = sleepLog.slice(-7);
  if (!recent.length) return { hours: 0, label: 'No history', averageHours: null };

  const durations = recent.map(e => (new Date(e.waketime) - new Date(e.bedtime)) / 3600000)
    .filter(hours => hours > 1 && hours < 12);
  if (!durations.length) return { hours: 0, label: 'No clean history', averageHours: null };

  const averageHours = durations.reduce((a, b) => a + b, 0) / durations.length;
  const debt = Math.max(0, (targetHours - averageHours) * durations.length);
  const label = debt < 2 ? 'Recovered' : debt < 6 ? 'Mild debt' : 'High debt';
  return { hours: Math.round(debt * 10) / 10, label, averageHours: Math.round(averageHours * 10) / 10 };
}

export function getBestWakeWindow(personalCycleLength) {
  const cycle = personalCycleLength || CYCLE_MIN;
  const start = new Date();
  start.setHours(7, 0, 0, 0);
  const offset = Math.round((cycle - CYCLE_MIN) / 2);
  start.setMinutes(start.getMinutes() + offset);
  const end = new Date(start.getTime() + 30 * 60000);
  return { start, end };
}

export function getSleepTrend(sleepLog) {
  if (sleepLog.length < 4) return 'stable';
  const recent = sleepLog.slice(-3).map(e => e.rating);
  const prev = sleepLog.slice(-6, -3).map(e => e.rating);
  if (prev.length === 0) return 'stable';
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
  const avgPrev = prev.reduce((a, b) => a + b, 0) / prev.length;
  if (avgRecent - avgPrev >= 0.5) return 'improving';
  if (avgPrev - avgRecent >= 0.5) return 'declining';
  return 'stable';
}
