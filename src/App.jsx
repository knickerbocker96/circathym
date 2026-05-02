import React, { useMemo, useState } from 'react';
import './App.css';
import CycleRing from './components/CycleRing/CycleRing';
import ClockDisplay from './components/ClockDisplay/ClockDisplay';
import TimePicker from './components/TimePicker/TimePicker';
import AlarmControls from './components/AlarmControls/AlarmControls';
import Recommendations from './components/Recommendations/Recommendations';
import { recommendWakeTimes, classifyWakeTime } from './logic/sleepCycle';
import useAlarm from './hooks/useAlarm';

export default function App() {
  const now = new Date();
  const [bedTime] = useState(now);
  const [wakeTimeStr, setWakeTimeStr] = useState(() => {
    const t = new Date(Date.now() + 1000 * 60 * 60 * 7);
    return t.toTimeString().slice(0, 5);
  });

  const wakeDate = useMemo(() => {
    const [hh, mm] = wakeTimeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    if (d < new Date()) d.setDate(d.getDate() + 1);
    return d;
  }, [wakeTimeStr]);

  const classification = classifyWakeTime(bedTime, wakeDate);
  const segments = 6;
  const activeIndex = Math.max(0, classification.cycleIndex) % segments;
  const colorMap = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444' };
  const ringColor = colorMap[classification.color] || '#ef4444';

  const rec = recommendWakeTimes(bedTime, 6);
  const { setAlarmAt, clearAlarm } = useAlarm();

  return (
    <div className="app">
      <header className="app-header">
        <h1>Circathym</h1>
      </header>

      <main className="app-main">
        <div className="ring-wrap">
          <CycleRing segments={segments} activeIndex={activeIndex} activeColor={ringColor} />
        </div>

        <ClockDisplay wakeDate={wakeDate} label={classification.label} />

        <TimePicker value={wakeTimeStr} onChange={setWakeTimeStr} />

        <AlarmControls onSet={() => { setAlarmAt(wakeDate); alert('Alarm set'); }} onClear={() => { clearAlarm(); alert('Cleared'); }} />

        <Recommendations times={rec} />
      </main>
    </div>
  );
}
