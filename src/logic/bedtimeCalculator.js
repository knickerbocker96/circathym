import { DEFAULT_LATENCY_MIN } from './sleepCycle';

export function recommendBedtimes(wakeByDate, cycleLength = 90, latency = DEFAULT_LATENCY_MIN) {
  const results = [];
  for (let n = 6; n >= 3; n--) {
    const bedMs = wakeByDate.getTime() - (latency + n * cycleLength) * 60000;
    results.push({ bedDate: new Date(bedMs), cycleCount: n });
  }
  return results;
}
