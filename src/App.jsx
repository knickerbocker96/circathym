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

const SNOOZE_OPTIONS = [5, 10, 15, 20, 30];

export default function App() {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [wakeTimeStr, setWakeTimeStr] = useState(() => {
    const t = new Date(Date.now() + 1000 * 60 * 60 * 7);
    return formatHHMM(roundToNextFiveMinutes(t));
  });
  const [hasUserSetWakeTime, setHasUserSetWakeTime] = useState(false);
  const [recommendationAnchor, setRecommendationAnchor] = useState(null);
  const [selectedRecommendationKey, setSelectedRecommendationKey] = useState(null);
  const [showCycleBoundaries, setShowCycleBoundaries] = useState(true);
  const [showRedStages, setShowRedStages] = useState(true);
  const [showAmberStages, setShowAmberStages] = useState(true);
  const [showGreenStages, setShowGreenStages] = useState(true);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [snoozeEnabled, setSnoozeEnabled] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [scheduledAlarmDate, setScheduledAlarmDate] = useState(null);
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

  const selectedWakeDate = useMemo(() => {
    return getNextTimeInTimeZone(wakeTimeStr, currentTime);
  }, [wakeTimeStr, currentTime]);
  const wakeDate = scheduledAlarmDate || selectedWakeDate;
  const showStageMarkers = showRedStages || showAmberStages || showGreenStages;

  const rec = useMemo(() => {
    if (!hasUserSetWakeTime || !recommendationAnchor) return [];

    return recommendNearbyWakeTimes(recommendationAnchor.bedDate, recommendationAnchor.wakeDate)
      .filter((item) => getRecommendationKey(item.date) !== selectedRecommendationKey);
  }, [hasUserSetWakeTime, recommendationAnchor, selectedRecommendationKey]);
  const { setAlarmAt, clearAlarm, unlockAlarmSound } = useAlarm(() => {
    setIsRinging(true);
    setAlarmEnabled(false);
    setScheduledAlarmDate(null);
  });

  function handleWakeTimeChange(nextWakeTime) {
    const nextWakeDate = getNextTimeInTimeZone(nextWakeTime, currentTime);

    setWakeTimeStr(nextWakeTime);
    setHasUserSetWakeTime(true);
    setRecommendationAnchor({
      bedDate: new Date(currentTime),
      wakeDate: nextWakeDate,
    });
    setSelectedRecommendationKey(null);
    setIsRinging(false);

    if (alarmEnabled) {
      setAlarmAt(nextWakeDate);
      setScheduledAlarmDate(nextWakeDate);
    }
  }

  function handleRecommendationSelect(recommendation) {
    const roundedDate = roundToNearestFiveMinutes(recommendation.date);

    setWakeTimeStr(formatHHMM(roundedDate));
    setHasUserSetWakeTime(true);
    setSelectedRecommendationKey(getRecommendationKey(roundedDate));
    setIsRinging(false);

    if (alarmEnabled) {
      setAlarmAt(roundedDate);
      setScheduledAlarmDate(roundedDate);
    }
  }

  function handleClear() {
    clearAlarm();
    setAlarmEnabled(false);
    setIsRinging(false);
    setScheduledAlarmDate(null);
  }

  function handleAlarmToggle() {
    if (alarmEnabled) {
      clearAlarm();
      setAlarmEnabled(false);
      setIsRinging(false);
      return;
    }

    const nextWakeDate = getNextTimeInTimeZone(wakeTimeStr, new Date());

    unlockAlarmSound();
    setAlarmAt(nextWakeDate);
    setScheduledAlarmDate(nextWakeDate);
    setAlarmEnabled(true);
    setHasUserSetWakeTime(true);
  }

  function handleSnoozeToggle() {
    setSnoozeEnabled((value) => !value);
  }

  function handleSnooze(minutes) {
    const nextWakeDate = new Date(Date.now() + minutes * 60 * 1000);

    setWakeTimeStr(formatHHMM(nextWakeDate));
    setHasUserSetWakeTime(true);
    setRecommendationAnchor({
      bedDate: new Date(currentTime),
      wakeDate: nextWakeDate,
    });
    setSelectedRecommendationKey(null);
    setIsRinging(false);
    setAlarmEnabled(true);
    setScheduledAlarmDate(nextWakeDate);
    setAlarmAt(nextWakeDate);
  }

  function handleStageToggle() {
    const nextValue = !showStageMarkers;

    setShowRedStages(nextValue);
    setShowAmberStages(nextValue);
    setShowGreenStages(nextValue);
  }

  function handleRagToggle(color) {
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

        <AlarmControls
          alarmEnabled={alarmEnabled}
          snoozeEnabled={snoozeEnabled}
          isRinging={isRinging}
          snoozeOptions={SNOOZE_OPTIONS}
          onAlarmToggle={handleAlarmToggle}
          onSnoozeToggle={handleSnoozeToggle}
          onSnooze={handleSnooze}
          onClear={handleClear}
        />
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
