export const MS_PER_MIN = 60000;
export const DEFAULT_LATENCY_MIN = 15;
export const CYCLE_MIN = 90;

export function addMinutes(date, mins) {
  return new Date(date.getTime() + mins * MS_PER_MIN);
}

export function recommendWakeTimes(bedDate, count = 6, latency = DEFAULT_LATENCY_MIN) {
  const start = addMinutes(bedDate, latency);
  return Array.from({ length: count }).map((_, i) => addMinutes(start, CYCLE_MIN * (i + 1)));
}

export function recommendNearbyWakeTimes(bedDate, wakeDate, latency = DEFAULT_LATENCY_MIN, cycle = CYCLE_MIN) {
  const onset = addMinutes(bedDate, latency);
  const deltaMin = Math.max(0, (wakeDate - onset) / MS_PER_MIN);
  const cycleIndexBefore = Math.floor(deltaMin / cycle);
  const boundaryBefore = addMinutes(onset, cycleIndexBefore * cycle);
  const boundaryAfter = addMinutes(onset, (cycleIndexBefore + 1) * cycle);

  return [
    { date: addMinutes(boundaryBefore, -15), color: 'amber' },
    { date: boundaryBefore, color: 'green' },
    { date: boundaryAfter, color: 'green' },
    { date: addMinutes(boundaryAfter, 15), color: 'amber' },
  ];
}

export function classifyWakeTime(bedDate, wakeDate, latency = DEFAULT_LATENCY_MIN, cycle = CYCLE_MIN) {
  const onset = addMinutes(bedDate, latency);
  const deltaMin = (wakeDate - onset) / MS_PER_MIN;
  if (deltaMin < 0) return { color: 'green', label: 'Before sleep onset', deltaMin };

  const posInCycle = ((deltaMin % cycle) + cycle) % cycle;
  const distToNearestBoundary = Math.min(posInCycle, cycle - posInCycle);

  let color = 'red', label = 'Disruptive';
  if (distToNearestBoundary <= 15) { color = 'green'; label = 'Optimal'; }
  else if (distToNearestBoundary <= 60 ) { color = 'amber'; label = 'Acceptable'; }

  const cycleIndex = Math.floor(deltaMin / cycle);
  const minutesToNextBoundary = cycle - posInCycle;
  return { color, label, posInCycle, cycleIndex, minutesToNextBoundary, deltaMin };
}
