import { recommendWakeTimes } from './sleepCycle';
export default function getWakeRecommendations(bedDate, count = 6) {
  return recommendWakeTimes(bedDate, count);
}
