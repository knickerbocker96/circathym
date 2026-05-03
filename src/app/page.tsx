'use client';

import { useEffect, useMemo, useState } from 'react';
import CycleRing from '@/components/CycleRing/CycleRing';
import TimePicker from '@/components/TimePicker';
import AlarmControls from '@/components/AlarmControls';
import Recommendations from '@/components/Recommendations';
import WakeLogger from '@/components/WakeLogger';
import InsightCard from '@/components/InsightCard';
import SleepCoach from '@/components/SleepCoach';
import BedtimeCalculator from '@/components/BedtimeCalculator';
import CycleComparisonCard from '@/components/CycleComparisonCard';
import { classifyWakeTime, recommendNearbyWakeTimes } from '@/logic/sleepCycle';
import { derivePersonalCycleLength, getBestWakeWindow, getCycleConfidence, getSleepDebt } from '@/logic/cyclePersonalization';
import { clearSleepLog, createDemoSleepLog, getSleepLog, logSleep, setSleepLog as persistSleepLog } from '@/utils/sleepStorage';
import useAlarm from '@/hooks/useAlarm';
import { formatHHMM, formatTime12, getNextTimeInTimeZone } from '@/utils/timeUtils';

const DEFAULT_ALARM_SETTINGS = { tone: 'gentle', volume: 0.65, fadeIn: true };

export default function Home() {
  const [currentTime, setCurrentTime] = useState(() => new Date(0));
  const [wakeTimeStr, setWakeTimeStr] = useState('07:00');
  const [hasUserSetWakeTime, setHasUserSetWakeTime] = useState(false);
  const [recommendationAnchor, setRecommendationAnchor] = useState<{ bedDate: Date; wakeDate: Date } | null>(null);
  const [selectedRecKey, setSelectedRecKey] = useState<string | null>(null);
  const [showCycleBoundaries, setShowCycleBoundaries] = useState(true);
  const [showRed, setShowRed] = useState(true);
  const [showAmber, setShowAmber] = useState(true);
  const [showGreen, setShowGreen] = useState(true);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [snoozeEnabled, setSnoozeEnabled] = useState(false);
  const [alarmSettings, setAlarmSettings] = useState(DEFAULT_ALARM_SETTINGS);
  const [isRinging, setIsRinging] = useState(false);
  const [scheduledAlarmDate, setScheduledAlarmDate] = useState<Date | null>(null);
  const [showWakeLogger, setShowWakeLogger] = useState(false);
  const [sleepLog, setSleepLog] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showUserAnalytics, setShowUserAnalytics] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    if (mounted) {
      try { localStorage.setItem('theme', darkMode ? 'dark' : 'light'); } catch {}
    }
  }, [darkMode, mounted]);

  useEffect(() => {
    if (mounted) {
      try { localStorage.setItem('alarmSettings', JSON.stringify(alarmSettings)); } catch {}
    }
  }, [alarmSettings, mounted]);

  useEffect(() => {
    setSleepLog(getSleepLog());
    setDarkMode(() => {
      try {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      } catch { return false; }
    });
    setAlarmSettings((prev) => {
      try {
        return { ...prev, ...JSON.parse(localStorage.getItem('alarmSettings') || '{}') };
      } catch { return prev; }
    });
    setWakeTimeStr(formatHHMM(roundToNext5(new Date(Date.now() + 7 * 3600 * 1000))));
    setCurrentTime(new Date());

    queueMicrotask(() => setMounted(true));
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const personalCycleLength = useMemo(() => derivePersonalCycleLength(sleepLog), [sleepLog]);
  const activeCycleLength = personalCycleLength || 90;
  const cycleConfidence = useMemo(() => getCycleConfidence(sleepLog), [sleepLog]);
  const sleepDebt = useMemo(() => getSleepDebt(sleepLog), [sleepLog]);
  const hasSleepHistory = sleepLog.length > 0;
  const bestWakeWindow = useMemo(() => getBestWakeWindow(personalCycleLength), [personalCycleLength]);
  const selectedWakeDate = useMemo(() => getNextTimeInTimeZone(wakeTimeStr, currentTime), [wakeTimeStr, currentTime]);
  const wakeDate = scheduledAlarmDate || selectedWakeDate;
  const showStageMarkers = showRed || showAmber || showGreen;
  const wakeClassification = useMemo(() => {
    const bedDate = recommendationAnchor?.bedDate ?? currentTime;
    return classifyWakeTime(bedDate, wakeDate, undefined, activeCycleLength);
  }, [activeCycleLength, currentTime, recommendationAnchor, wakeDate]);
  const smartSnoozeOptions = useMemo(() => {
    if (!recommendationAnchor) return [5, 10, 15, 20, 30];
    const elapsed = Math.max(0, (currentTime.getTime() - recommendationAnchor.bedDate.getTime()) / 60000 - 15);
    const pos = ((elapsed % activeCycleLength) + activeCycleLength) % activeCycleLength;
    const toBoundary = Math.max(5, Math.round(activeCycleLength - pos));
    return Array.from(new Set([5, 10, 15, Math.min(30, toBoundary), 30])).sort((a, b) => a - b);
  }, [activeCycleLength, currentTime, recommendationAnchor]);

  const rec = useMemo(() => {
    if (!hasUserSetWakeTime || !recommendationAnchor) return [];
    return recommendNearbyWakeTimes(
      recommendationAnchor.bedDate,
      recommendationAnchor.wakeDate,
      undefined,
      personalCycleLength || undefined
    ).filter(item => recKey(item.date) !== selectedRecKey) as { date: Date; color: 'green' | 'amber' | 'red' }[];
  }, [hasUserSetWakeTime, recommendationAnchor, selectedRecKey, personalCycleLength]);

  const [defaultLogBedtime, setDefaultLogBedtime] = useState('');
  const [defaultLogWaketime, setDefaultLogWaketime] = useState('');

  useEffect(() => {
    if (showWakeLogger) {
      queueMicrotask(() => {
        setDefaultLogBedtime(formatHHMM(recommendationAnchor?.bedDate ?? new Date(Date.now() - 8 * 3600 * 1000)));
        setDefaultLogWaketime(formatHHMM(new Date()));
      });
    }
  }, [showWakeLogger, recommendationAnchor]);

  const { setAlarmAt, clearAlarm, unlockAlarmSound, testAlarm, stopAlarmSound } = useAlarm(() => {
    setIsRinging(true);
    setAlarmEnabled(false);
    setScheduledAlarmDate(null);
    setShowWakeLogger(true);
  });

  function handleLogSleep(entry: { rating: number; bedtime: string; waketime: string }) {
    const waketime = getDateForTime(entry.waketime, currentTime);
    let bedtime = getDateForTime(entry.bedtime, waketime);
    if (bedtime >= waketime) bedtime = new Date(bedtime.getTime() - 24 * 3600 * 1000);
    logSleep({ bedtime, waketime, rating: entry.rating });
    setSleepLog(getSleepLog());
  }

  function runJudgeDemo() {
    // Seed a deterministic AI insight so the coach response is instant + compelling
    try {
      localStorage.setItem('circathym_daily_insight', JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        text: 'Your 94-minute rhythm diverges from the textbook 90-minute model by 4 minutes per cycle — subtle but meaningful. Six of your last eight wakes rated 4 or higher, consistently aligning near 94-minute boundaries. At 7:15 AM, a generic app lands 30 minutes from its cycle edge; Circathym lands 10 minutes from yours.',
      }));
    } catch {}

    // Load demo sleep log (engineered to produce 94m learned cycle)
    setSleepLog(persistSleepLog(createDemoSleepLog(new Date())));

    // Anchor: last night 11 pm → 7:15 AM wake (AMBER on 90m, GREEN on 94m)
    const bedDate = new Date();
    bedDate.setHours(23, 0, 0, 0);
    if (bedDate > new Date()) bedDate.setDate(bedDate.getDate() - 1);
    const demoWake = getNextTimeInTimeZone('07:15', new Date());

    setWakeTimeStr('07:15');
    setHasUserSetWakeTime(true);
    setRecommendationAnchor({ bedDate, wakeDate: demoWake });
    setSelectedRecKey(null);
    setIsRinging(false);
    setShowUserAnalytics(true);
  }

  function resetDemoProfile() {
    clearSleepLog();
    setSleepLog([]);
    setHasUserSetWakeTime(false);
    setRecommendationAnchor(null);
    setSelectedRecKey(null);
    setShowUserAnalytics(false);
  }

  function handleWakeTimeChange(next: string) {
    const nextDate = getNextTimeInTimeZone(next, currentTime);
    setWakeTimeStr(next);
    setHasUserSetWakeTime(true);
    setRecommendationAnchor({ bedDate: new Date(currentTime), wakeDate: nextDate });
    setSelectedRecKey(null);
    setIsRinging(false);
    if (alarmEnabled) { setAlarmAt(nextDate, alarmSettings); setScheduledAlarmDate(nextDate); }
  }

  function handleRecommendationSelect(r: { date: Date }) {
    const rounded = roundToNearest5(r.date);
    setWakeTimeStr(formatHHMM(rounded));
    setHasUserSetWakeTime(true);
    setSelectedRecKey(recKey(rounded));
    setIsRinging(false);
    if (alarmEnabled) { setAlarmAt(rounded, alarmSettings); setScheduledAlarmDate(rounded); }
  }

  function handleUseBedtimePlan(option: { bedDate: Date; cycleCount: number }, wakeByDate: Date) {
    const roundedWake = roundToNearest5(wakeByDate);
    setWakeTimeStr(formatHHMM(roundedWake));
    setHasUserSetWakeTime(true);
    setRecommendationAnchor({ bedDate: option.bedDate, wakeDate: roundedWake });
    setSelectedRecKey(null);
    setIsRinging(false);
    setScheduledAlarmDate(roundedWake);
    if (alarmEnabled) setAlarmAt(roundedWake, alarmSettings);
  }

  function handleClear() {
    stopAlarmSound();
    clearAlarm(); setAlarmEnabled(false); setIsRinging(false);
    setScheduledAlarmDate(null); setShowWakeLogger(false);
  }

  function handleAlarmToggle() {
    if (alarmEnabled) { clearAlarm(); setAlarmEnabled(false); setIsRinging(false); return; }
    const next = getNextTimeInTimeZone(wakeTimeStr, new Date());
    unlockAlarmSound(); setAlarmAt(next, alarmSettings); setScheduledAlarmDate(next);
    setAlarmEnabled(true); setHasUserSetWakeTime(true);
  }

  function handleSnooze(minutes: number) {
    const next = new Date(Date.now() + minutes * 60 * 1000);
    setWakeTimeStr(formatHHMM(next));
    setHasUserSetWakeTime(true);
    setRecommendationAnchor({ bedDate: new Date(currentTime), wakeDate: next });
    setSelectedRecKey(null); setIsRinging(false); setShowWakeLogger(false);
    stopAlarmSound();
    setAlarmEnabled(true); setScheduledAlarmDate(next); setAlarmAt(next, alarmSettings);
  }

  function handleStopRinging() {
    stopAlarmSound();
    setIsRinging(false);
    setShowWakeLogger(true);
  }

  function handleTestAlarm() {
    testAlarm(alarmSettings);
  }

  function toggleAllStages() {
    const next = !showStageMarkers;
    setShowRed(next); setShowAmber(next); setShowGreen(next);
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Navigation bar ── */}
      <header
        className="sticky top-0 z-20 backdrop-blur-xl backdrop-saturate-150"
        style={{
          background: 'var(--card-overlay)',
          borderBottom: '1px solid var(--apple-separator)',
        }}
      >
        <div className="max-w-5xl mx-auto px-5 h-[52px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[17px]" style={{ color: 'var(--foreground)' }}>
              Circathym
            </span>
            <span
              className="text-[10px] font-bold px-[6px] py-[2px] rounded-md"
              style={{ background: 'var(--apple-blue)', color: '#fff', letterSpacing: '0.04em' }}
            >
              AI
            </span>
          </div>
          <span
            className="hidden sm:block text-[13px] font-medium"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Adaptive Sleep Rhythm
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={runJudgeDemo}
              className="h-8 px-4 rounded-full text-[13px] font-semibold transition-opacity hover:opacity-85 flex items-center gap-1.5"
              style={{ background: 'var(--apple-blue)', color: '#FFFFFF' }}
            >
              <span>✦</span>
              <span>Judge Demo</span>
            </button>
            <button
              onClick={resetDemoProfile}
              className="h-8 px-4 rounded-full text-[13px] font-medium transition-colors"
              style={{
                background: 'var(--secondary)',
                color: 'var(--muted-foreground)',
                border: 'none',
              }}
            >
              Reset
            </button>
            <button
              onClick={() => setDarkMode(v => !v)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[15px] transition-colors"
              style={{ background: 'var(--apple-fill)', border: 'none' }}
              aria-label="Toggle dark mode"
            >
              {mounted ? (darkMode ? '☀︎' : '☽') : '☽'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {!mounted ? (
          <div className="flex flex-col justify-center items-center h-64 gap-3">
            <div
              className="w-8 h-8 rounded-full border-[3px] animate-spin"
              style={{
                borderColor: 'var(--secondary)',
                borderTopColor: 'var(--apple-blue)',
              }}
            />
            <span className="text-[13px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
              Loading…
            </span>
          </div>
        ) : (
          <>
            {/* User Analytics */}
            <section
              className="mb-5 overflow-hidden rounded-2xl bg-card card-shadow"
              style={{ border: '1px solid var(--apple-separator)' }}
            >
              <button
                type="button"
                aria-expanded={showUserAnalytics}
                onClick={() => setShowUserAnalytics(v => !v)}
                className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-4 text-center transition-colors"
              >
                <span aria-hidden="true" />
                <h2 className="text-[17px] font-bold tracking-normal" style={{ color: 'var(--foreground)' }}>
                  Analytics
                </h2>
                <span
                  className="justify-self-end rounded-full px-3 py-1 text-[12px] font-semibold"
                  style={{
                    background: 'var(--apple-fill)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  {showUserAnalytics ? 'Hide' : 'View'}
                </span>
              </button>

              {showUserAnalytics && (
                <div
                  className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4"
                  style={{ borderTop: '1px solid var(--apple-separator)' }}
                >
                  <Metric
                    label="Cycle"
                    value={hasSleepHistory ? `${activeCycleLength}m` : '--'}
                    note={personalCycleLength ? 'learned' : undefined}
                    muted={!hasSleepHistory}
                  />
                  <Metric
                    label="Confidence"
                    value={hasSleepHistory ? cycleConfidence.label : '--'}
                    note={hasSleepHistory ? cycleConfidence.reason : undefined}
                    muted={!hasSleepHistory}
                  />
                  <Metric
                    label="Best Wake"
                    value={hasSleepHistory ? `${formatTime12(bestWakeWindow.start)}–${formatTime12(bestWakeWindow.end)}` : '--'}
                    note={personalCycleLength ? 'personal window' : undefined}
                    muted={!hasSleepHistory}
                  />
                  <Metric
                    label="Sleep Debt"
                    value={hasSleepHistory ? sleepDebt.label : '--'}
                    note={sleepDebt.averageHours ? `${sleepDebt.averageHours}h avg` : undefined}
                    muted={!hasSleepHistory}
                  />
                </div>
              )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* ══ Left column ══ */}
              <div className="space-y-4">

                {/* Clock card */}
                <div
                  className="rounded-2xl bg-card card-shadow p-6"
                  style={{ border: '1px solid var(--apple-separator)' }}
                >
                  <div className="flex justify-center">
                    <CycleRing
                      currentTime={currentTime}
                      wakeDate={wakeDate}
                      showCycleBoundaries={showCycleBoundaries}
                      showStageMarkers={showStageMarkers}
                      showRedStages={showRed}
                      showAmberStages={showAmber}
                      showGreenStages={showGreen}
                      cycleMinutes={activeCycleLength}
                      wakeClassification={wakeClassification}
                      size={280}
                    />
                  </div>

                  <WakeScore
                    classification={wakeClassification}
                    wakeDate={wakeDate}
                    cycleLength={activeCycleLength}
                  />

                  {/* Cycle/stage toggles */}
                  <div className="mt-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <ToggleBtn active={showCycleBoundaries} onClick={() => setShowCycleBoundaries(v => !v)}>
                        Cycles
                      </ToggleBtn>
                      <ToggleBtn active={showStageMarkers} onClick={toggleAllStages}>
                        Stages
                      </ToggleBtn>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <RagBtn color="red" active={showRed} onClick={() => setShowRed(v => !v)}>Light</RagBtn>
                      <RagBtn color="amber" active={showAmber} onClick={() => setShowAmber(v => !v)}>NREM</RagBtn>
                      <RagBtn color="green" active={showGreen} onClick={() => setShowGreen(v => !v)}>REM</RagBtn>
                    </div>
                  </div>

                  <p className="mt-3 text-center text-[11px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    {personalCycleLength
                      ? `${personalCycleLength}m cycle learned from your wake quality`
                      : 'Default 90m cycle — log 3 wakes to personalize'}
                  </p>
                </div>

                {/* Moved Recommendations here for better visibility */}
                {hasUserSetWakeTime && rec.length > 0 && (
                  <Recommendations
                    times={rec}
                    onSelect={handleRecommendationSelect}
                    cycleLength={activeCycleLength}
                    bedDate={recommendationAnchor?.bedDate ?? null}
                  />
                )}

                {/* Wake time picker */}
                <div
                  className="rounded-2xl bg-card card-shadow p-6"
                  style={{ border: '1px solid var(--apple-separator)' }}
                >
                  <TimePicker value={wakeTimeStr} onChange={handleWakeTimeChange} />
                </div>

                {/* Alarm controls */}
                <div
                  className="rounded-2xl bg-card card-shadow p-5"
                  style={{ border: '1px solid var(--apple-separator)' }}
                >
                  <AlarmControls
                    alarmEnabled={alarmEnabled}
                    snoozeEnabled={snoozeEnabled}
                    isRinging={isRinging}
                    scheduledLabel={scheduledAlarmDate ? formatTime12(scheduledAlarmDate) : null}
                    alarmSettings={alarmSettings}
                    snoozeOptions={smartSnoozeOptions}
                    onAlarmToggle={handleAlarmToggle}
                    onSnoozeToggle={() => setSnoozeEnabled(v => !v)}
                    onAlarmSettingsChange={setAlarmSettings}
                    onSnooze={handleSnooze}
                    onClear={handleClear}
                    onStop={handleStopRinging}
                    onTestAlarm={handleTestAlarm}
                  />
                </div>
              </div>

              {/* ══ Right column ══ */}
              <div className="space-y-4">

                <CycleComparisonCard
                  personalCycleLength={personalCycleLength}
                  sleepLog={sleepLog}
                  bedDate={recommendationAnchor?.bedDate ?? null}
                  wakeDate={wakeDate}
                />

                {sleepLog.length >= 5 && (
                  <InsightCard personalCycleLength={personalCycleLength} sleepLog={sleepLog} />
                )}

                {showWakeLogger ? (
                  <WakeLogger
                    defaultBedtime={defaultLogBedtime}
                    defaultWaketime={defaultLogWaketime}
                    onLog={handleLogSleep}
                    onDismiss={() => setShowWakeLogger(false)}
                  />
                ) : (
                  <div className="text-center">
                    <button
                      onClick={() => setShowWakeLogger(true)}
                      className="text-[13px] font-medium transition-colors"
                      style={{ color: 'var(--apple-blue)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      Log last night&apos;s wake quality
                    </button>
                  </div>
                )}

                <BedtimeCalculator personalCycleLength={personalCycleLength} onUsePlan={handleUseBedtimePlan} />
                <SleepCoach personalCycleLength={personalCycleLength} sleepLog={sleepLog} />
              </div>
            </div>
          </>
        )}

        <p className="text-center text-[11px] mt-12 font-medium" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>
          Powered by OpenAI · BeaverHacks 2026
        </p>
      </main>
    </div>
  );
}

/* ── Toggle button (Cycles / Stages) ── */
function ToggleBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="h-9 rounded-xl text-[13px] font-semibold transition-all duration-150"
      style={{
        background: active ? 'var(--primary)' : 'var(--secondary)',
        color: active ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
        border: 'none',
      }}
    >
      {children}
    </button>
  );
}

/* ── RAG stage buttons ── */
const RAG_STYLE: Record<string, { activeBg: string; activeText: string; activeBorder: string }> = {
  red: {
    activeBg: 'rgba(255, 59, 48, 0.12)',
    activeText: '#FF3B30',
    activeBorder: 'rgba(255, 59, 48, 0.35)',
  },
  amber: {
    activeBg: 'rgba(255, 149, 0, 0.12)',
    activeText: '#FF9500',
    activeBorder: 'rgba(255, 149, 0, 0.35)',
  },
  green: {
    activeBg: 'rgba(52, 199, 89, 0.12)',
    activeText: '#34C759',
    activeBorder: 'rgba(52, 199, 89, 0.35)',
  },
};

function RagBtn({ color, active, onClick, children }: {
  color: string; active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  const c = RAG_STYLE[color];
  return (
    <button
      onClick={onClick}
      className="h-8 rounded-xl text-[12px] font-semibold transition-all duration-150"
      style={{
        background: active ? c.activeBg : 'var(--secondary)',
        color: active ? c.activeText : 'var(--muted-foreground)',
        border: active ? `1px solid ${c.activeBorder}` : '1px solid transparent',
      }}
    >
      {children}
    </button>
  );
}

/* ── Stats metric card ── */
function Metric({ label, value, note, muted = false }: { label: string; value: string; note?: string; muted?: boolean }) {
  return (
    <div
      className="rounded-2xl bg-card card-shadow px-4 py-3 text-center"
      style={{ border: '1px solid var(--apple-separator)' }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </p>
      <p
        className="text-[17px] font-semibold leading-tight mt-0.5"
        style={{
          color: muted ? 'var(--muted-foreground)' : 'var(--foreground)',
          opacity: muted ? 0.55 : 1,
        }}
      >
        {value}
      </p>
      {note && (
        <p className="text-[11px] font-medium mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>
          {note}
        </p>
      )}
    </div>
  );
}

/* ── Wake quality score banner ── */
const WAKE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  green: { bg: 'rgba(52, 199, 89, 0.1)', border: 'rgba(52, 199, 89, 0.3)', text: '#34C759' },
  amber: { bg: 'rgba(255, 149, 0, 0.1)', border: 'rgba(255, 149, 0, 0.3)', text: '#FF9500' },
  red:   { bg: 'rgba(255, 59, 48, 0.08)', border: 'rgba(255, 59, 48, 0.25)', text: '#FF3B30' },
};

function WakeScore({
  classification,
  wakeDate,
  cycleLength,
}: {
  classification: { color: string; label: string; deltaMin: number; posInCycle?: number; minutesToNextBoundary?: number };
  wakeDate: Date;
  cycleLength: number;
}) {
  const c = WAKE_COLORS[classification.color] || WAKE_COLORS.green;
  const distance = getBoundaryDistance(classification, cycleLength);
  return (
    <div
      className="mt-4 rounded-xl px-4 py-2.5 text-center"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      <p className="text-[13px] font-semibold" style={{ color: c.text }}>
        {formatTime12(wakeDate)} · {classification.label}
      </p>
      <p className="text-[11px] font-medium mt-0.5" style={{ color: c.text, opacity: 0.75 }}>
        {distance}m from your {cycleLength}m cycle boundary
      </p>
    </div>
  );
}

function getBoundaryDistance(
  classification: { deltaMin: number; posInCycle?: number; minutesToNextBoundary?: number },
  cycleLength: number
) {
  if (classification.deltaMin < 0) return 0;
  const pos = classification.posInCycle ?? 0;
  const next = classification.minutesToNextBoundary ?? cycleLength;
  return Math.round(Math.min(pos, next));
}

function recKey(date: Date) { return formatHHMM(roundToNearest5(date)); }
function roundToNext5(d: Date) { const r = new Date(d); r.setMinutes(Math.ceil(r.getMinutes() / 5) * 5, 0, 0); return r; }
function roundToNearest5(d: Date) { const r = new Date(d); r.setMinutes(Math.round(r.getMinutes() / 5) * 5, 0, 0); return r; }
function getDateForTime(time: string, anchor: Date) {
  const [hour, minute] = time.split(':').map(Number);
  const date = new Date(anchor);
  date.setHours(hour, minute, 0, 0);
  return date;
}
