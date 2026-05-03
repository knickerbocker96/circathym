'use client';

import { useEffect, useState } from 'react';
import { getCycleConfidence, getSleepDebt, getSleepTrend } from '@/logic/cyclePersonalization';

interface Entry { bedtime: string; waketime: string; rating: number; }
interface Props { personalCycleLength: number | null; sleepLog: Entry[]; }

const TREND_LABEL = { improving: '↑ Improving', stable: '→ Stable', declining: '↓ Declining' };
const TREND_COLOR: Record<string, string> = {
  improving: '#34C759',
  stable: '#FF9500',
  declining: '#FF3B30',
};

function todayKey() { return new Date().toISOString().slice(0, 10); }

async function fetchInsight(personalCycleLength: number | null, sleepLog: Entry[]) {
  const CACHE = 'circathym_daily_insight';
  try {
    const raw = localStorage.getItem(CACHE);
    if (raw) {
      const { date, text } = JSON.parse(raw);
      if (date === todayKey()) return text as string;
    }
  } catch {}

  const recent = sleepLog.slice(-5);
  const cycleInfo = personalCycleLength ? `${personalCycleLength} min` : '90 min (default)';

  const res = await fetch('/api/insight', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ personalCycleLength, sleepLog: recent }),
  });
  const data = await res.json();

  const text = data.insight || `Your best wakes cluster near ${cycleInfo} cycle boundaries.`;
  try { localStorage.setItem(CACHE, JSON.stringify({ date: todayKey(), text })); } catch {}
  return text;
}

export default function InsightCard({ personalCycleLength, sleepLog }: Props) {
  const [insight, setInsight] = useState('');
  const trend = getSleepTrend(sleepLog) as keyof typeof TREND_LABEL;
  const confidence = getCycleConfidence(sleepLog);
  const sleepDebt = getSleepDebt(sleepLog);
  const avgRating = sleepLog.length
    ? (sleepLog.slice(-7).reduce((a, e) => a + e.rating, 0) / Math.min(sleepLog.length, 7)).toFixed(1)
    : null;

  useEffect(() => {
    fetchInsight(personalCycleLength, sleepLog).then(setInsight).catch(() => {});
  }, []);

  return (
    <div className="rounded-2xl bg-card card-shadow p-5 space-y-4" style={{ border: '1px solid var(--apple-separator)' }}>
      <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-center" style={{ color: 'var(--muted-foreground)' }}>
        Sleep Profile
      </p>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="My Cycle" value={personalCycleLength ? `${personalCycleLength}m` : '90m'} accent={personalCycleLength ? 'var(--apple-blue)' : undefined} note={personalCycleLength ? 'learned' : 'default'} />
        <Stat label="Avg Quality" value={avgRating ? `${avgRating}/5` : '—'} />
        <Stat label="Trend" value={TREND_LABEL[trend]} valueColor={TREND_COLOR[trend]} />
      </div>

      <div
        className="grid grid-cols-2 gap-3 pt-4"
        style={{ borderTop: '1px solid var(--apple-separator)' }}
      >
        <Stat label="Confidence" value={confidence.label} note={confidence.reason} />
        <Stat label="Sleep Debt" value={sleepDebt.label} note={sleepDebt.averageHours ? `${sleepDebt.averageHours}h avg` : undefined} />
      </div>

      {insight && (
        <p
          className="text-[12px] font-medium italic text-center leading-relaxed pt-4"
          style={{ color: 'var(--muted-foreground)', borderTop: '1px solid var(--apple-separator)' }}
        >
          &ldquo;{insight}&rdquo;
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, note, accent, valueColor }: {
  label: string;
  value: string;
  note?: string;
  accent?: string;
  valueColor?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.06em]"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {label}
      </span>
      <span
        className="text-[15px] font-semibold leading-tight"
        style={{ color: valueColor || 'var(--foreground)' }}
      >
        {value}
      </span>
      {note && (
        <span className="text-[10px] font-medium" style={{ color: accent || 'var(--apple-blue)' }}>
          {note}
        </span>
      )}
    </div>
  );
}
