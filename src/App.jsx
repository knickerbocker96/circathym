import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import CycleRing from './components/CycleRing/CycleRing';
import ClockDisplay from './components/ClockDisplay/ClockDisplay';
import TimePicker from './components/TimePicker/TimePicker';
import AlarmControls from './components/AlarmControls/AlarmControls';
import Recommendations from './components/Recommendations/Recommendations';
import { recommendWakeTimes } from './logic/sleepCycle';
import useAlarm from './hooks/useAlarm';
import { formatHHMM, getNextTimeInTimeZone } from './utils/timeUtils';

export default function App() {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [wakeTimeStr, setWakeTimeStr] = useState(() => {
    const t = new Date(Date.now() + 1000 * 60 * 60 * 7);
    return formatHHMM(t);
  });

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
    return recommendWakeTimes(currentTime, 6);
  }, [currentTime]);
  const { setAlarmAt, clearAlarm } = useAlarm();

  function handleRecommendationSelect(date) {
    setWakeTimeStr(formatHHMM(date));
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

        <TimePicker value={wakeTimeStr} onChange={setWakeTimeStr} />

        <AlarmControls onSet={() => { setAlarmAt(wakeDate); alert('Alarm set'); }} onClear={() => { clearAlarm(); alert('Cleared'); }} />

        <Recommendations times={rec} onSelect={handleRecommendationSelect} />
      </main>
    </div>
  );
}
