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
  const [recommendationAnchor, setRecommendationAnchor] = useState(null);
  const [selectedRecommendationKey, setSelectedRecommendationKey] = useState(null);
  const [showCycleBoundaries, setShowCycleBoundaries] = useState(false);
  const [showStageMarkers, setShowStageMarkers] = useState(false);
  const [showRedStages, setShowRedStages] = useState(false);
  const [showAmberStages, setShowAmberStages] = useState(false);
  const [showGreenStages, setShowGreenStages] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      return saved ? saved === 'dark' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try { localStorage.setItem('theme', darkMode ? 'dark' : 'light'); } catch (e) {}
  }, [darkMode]);

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
    if (!hasUserSetWakeTime || !recommendationAnchor) return [];

    return recommendNearbyWakeTimes(recommendationAnchor.bedDate, recommendationAnchor.wakeDate)
      .filter((item) => getRecommendationKey(item.date) !== selectedRecommendationKey);
  }, [hasUserSetWakeTime, recommendationAnchor, selectedRecommendationKey]);
  const { setAlarmAt, clearAlarm } = useAlarm();

  function handleWakeTimeChange(nextWakeTime) {
    const nextWakeDate = getNextTimeInTimeZone(nextWakeTime, currentTime);

    setWakeTimeStr(nextWakeTime);
    setHasUserSetWakeTime(true);
    setRecommendationAnchor({
      bedDate: new Date(currentTime),
      wakeDate: nextWakeDate,
    });
    setSelectedRecommendationKey(null);
  }

  function handleRecommendationSelect(recommendation) {
    const roundedDate = roundToNearestFiveMinutes(recommendation.date);

    setWakeTimeStr(formatHHMM(roundedDate));
    setHasUserSetWakeTime(true);
    setSelectedRecommendationKey(getRecommendationKey(roundedDate));
  }

  function handleClear() {
    clearAlarm();
    setHasUserSetWakeTime(false);
    setRecommendationAnchor(null);
    setSelectedRecommendationKey(null);
    alert('Cleared');
  }

  function handleStageToggle() {
    const nextValue = !showStageMarkers;

    setShowStageMarkers(nextValue);
    setShowRedStages(nextValue);
    setShowAmberStages(nextValue);
    setShowGreenStages(nextValue);
  }

  function handleRagToggle(color) {
    setShowStageMarkers(true);

    if (color === 'red') {
      setShowRedStages((value) => !value);
    } else if (color === 'amber') {
      setShowAmberStages((value) => !value);
    } else if (color === 'green') {
      setShowGreenStages((value) => !value);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Circathym</h1>
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setDarkMode((v) => !v)}
          aria-label="Toggle dark mode"
        >
          {darkMode ? 'Light' : 'Dark'}
        </button>
      </header>

      <main className="app-main">
        <div className="ring-wrap">
          <CycleRing
            currentTime={currentTime}
            wakeDate={wakeDate}
            showCycleBoundaries={showCycleBoundaries}
            showStageMarkers={showStageMarkers}
            showRedStages={showRedStages}
            showAmberStages={showAmberStages}
            showGreenStages={showGreenStages}
          />
        </div>

        <ClockDisplay />

        <div className="display-toggles" aria-label="Clock display options">
          <button
            type="button"
            className={showCycleBoundaries ? 'display-toggle display-toggle--active' : 'display-toggle'}
            onClick={() => setShowCycleBoundaries((value) => !value)}
          >
            Cycles
          </button>
          <button
            type="button"
            className={showStageMarkers ? 'display-toggle display-toggle--active' : 'display-toggle'}
            onClick={handleStageToggle}
          >
            Stages
          </button>
        </div>

        <div className="rag-toggles" aria-label="Stage marker color options">
          <button
            type="button"
            className={showRedStages ? 'rag-toggle rag-toggle--red rag-toggle--active' : 'rag-toggle rag-toggle--red'}
            onClick={() => handleRagToggle('red')}
          >
            Red
          </button>
          <button
            type="button"
            className={showAmberStages ? 'rag-toggle rag-toggle--amber rag-toggle--active' : 'rag-toggle rag-toggle--amber'}
            onClick={() => handleRagToggle('amber')}
          >
            Amber
          </button>
          <button
            type="button"
            className={showGreenStages ? 'rag-toggle rag-toggle--green rag-toggle--active' : 'rag-toggle rag-toggle--green'}
            onClick={() => handleRagToggle('green')}
          >
            Green
          </button>
        </div>

        <TimePicker value={wakeTimeStr} onChange={handleWakeTimeChange} />

        {hasUserSetWakeTime && <Recommendations times={rec} onSelect={handleRecommendationSelect} />}

        <AlarmControls onSet={() => { setAlarmAt(wakeDate); alert('Alarm set'); }} onClear={handleClear} />
      </main>
    </div>
  );
}

function getRecommendationKey(date) {
  return formatHHMM(roundToNearestFiveMinutes(date));
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
