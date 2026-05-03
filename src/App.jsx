import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import CycleRing from './components/CycleRing/CycleRing';
import ClockDisplay from './components/ClockDisplay/ClockDisplay';
import TimePicker from './components/TimePicker/TimePicker';
import AlarmControls from './components/AlarmControls/AlarmControls';
import Recommendations from './components/Recommendations/Recommendations';
import { recommendNearbyWakeTimes } from './logic/sleepCycle';
import useAlarm from './hooks/useAlarm';
import { formatHHMM, getNextTimeInTimeZone } from './utils/timeUtils';

export default function App() {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [wakeTimeStr, setWakeTimeStr] = useState(() => {
    const t = new Date(Date.now() + 1000 * 60 * 60 * 7);
    return formatHHMM(roundToNextFiveMinutes(t));
  });
  const [hasUserSetWakeTime, setHasUserSetWakeTime] = useState(false);

  useEffect(() => {
    function tick() {
      setCurrentTime(new Date());
    }

    tick();
    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, []);

  const wakeDate = useMemo(() => {
    return getNextTimeInTimeZone(wakeTimeStr, currentTime);
  }, [wakeTimeStr, currentTime]);

  const rec = useMemo(() => {
    if (!hasUserSetWakeTime) return [];
    return recommendNearbyWakeTimes(currentTime, wakeDate);
  }, [currentTime, hasUserSetWakeTime, wakeDate]);
  const { setAlarmAt, clearAlarm } = useAlarm();

  function handleWakeTimeChange(nextWakeTime) {
    setWakeTimeStr(nextWakeTime);
    setHasUserSetWakeTime(true);
  }

  function handleRecommendationSelect(recommendation) {
    setWakeTimeStr(formatHHMM(roundToNearestFiveMinutes(recommendation.date)));
    setHasUserSetWakeTime(true);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Circathym</h1>
      </header>

      <main className="app-main">
        <div className="ring-wrap">
          <CycleRing currentTime={currentTime} wakeDate={wakeDate} />
        </div>

        <ClockDisplay />

        <TimePicker value={wakeTimeStr} onChange={handleWakeTimeChange} />

        {hasUserSetWakeTime && <Recommendations times={rec} onSelect={handleRecommendationSelect} />}

        <AlarmControls onSet={() => { setAlarmAt(wakeDate); alert('Alarm set'); }} onClear={() => { clearAlarm(); alert('Cleared'); }} />
      </main>
    </div>
  );
}

function roundToNextFiveMinutes(date) {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const nextMinutes = Math.ceil(minutes / 5) * 5;

  rounded.setMinutes(nextMinutes, 0, 0);
  return rounded;
}

function roundToNearestFiveMinutes(date) {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const nextMinutes = Math.round(minutes / 5) * 5;

  rounded.setMinutes(nextMinutes, 0, 0);
  return rounded;
}
