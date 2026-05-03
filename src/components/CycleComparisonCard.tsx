'use client';

import { useMemo } from 'react';
import { classifyWakeTime } from '@/logic/sleepCycle';
import { getCycleConfidence } from '@/logic/cyclePersonalization';
import { formatTime12 } from '@/utils/timeUtils';

interface Entry { bedtime: string; waketime: string; rating: number; }

interface Classification {
  color: string;
  label: string;
  posInCycle: number;
  minutesToNextBoundary: number;
  deltaMin: number;
}

interface Props {
  personalCycleLength: number | null;
  sleepLog: Entry[];
  bedDate: Date | null;
  wakeDate: Date;
}

function boundaryDist(cls: Classification, cycle: number) {
  return Math.round(Math.min(cls.posInCycle ?? 0, cls.minutesToNextBoundary ?? cycle));
}

const RAG: Record<string, { color: string; bg: string; border: string }> = {
  green: { color: '#34C759', bg: 'rgba(52,199,89,0.1)',   border: 'rgba(52,199,89,0.3)' },
  amber: { color: '#FF9500', bg: 'rgba(255,149,0,0.1)',   border: 'rgba(255,149,0,0.3)' },
  red:   { color: '#FF3B30', bg: 'rgba(255,59,48,0.08)',  border: 'rgba(255,59,48,0.25)' },
};

export default function CycleComparisonCard({ personalCycleLength, sleepLog, bedDate, wakeDate }: Props) {
  const goodWakes = sleepLog.filter(e => e.rating >= 4).length;
  const confidence = getCycleConfidence(sleepLog);
  const UNLOCK_AT = 3;

  /* ── Pending state ── */
  if (!personalCycleLength) {
    const progress = Math.min(goodWakes, UNLOCK_AT);
    return (
      <div
        className="rounded-2xl bg-card card-shadow p-5"
        style={{ border: '1px solid var(--apple-separator)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[15px]">✦</span>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--foreground)' }}>
            Rhythm Comparison
          </p>
        </div>

        <p className="text-[13px] font-medium leading-relaxed mb-4" style={{ color: 'var(--muted-foreground)' }}>
          After {UNLOCK_AT} quality wake logs, Circathym will show you exactly how your learned rhythm differs from the generic 90-minute model — and prove it matters.
        </p>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--muted-foreground)' }}>
              Quality wakes logged
            </span>
            <span className="text-[11px] font-semibold" style={{ fontFamily: 'var(--code-font)', fontVariantNumeric: 'tabular-nums', color: 'var(--apple-blue)' }}>
              {progress} / {UNLOCK_AT}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(progress / UNLOCK_AT) * 100}%`,
                background: 'var(--apple-blue)',
              }}
            />
          </div>
          <p className="text-[11px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
            {UNLOCK_AT - progress > 0
              ? `${UNLOCK_AT - progress} more needed — rate your next wake 4 or 5`
              : 'Almost there!'}
          </p>
        </div>
      </div>
    );
  }

  /* ── Comparison state ── */
  const bed = bedDate ?? new Date(wakeDate.getTime() - 8.5 * 3600 * 1000);

  const genericClass = classifyWakeTime(bed, wakeDate, undefined, 90) as Classification;
  const learnedClass = classifyWakeTime(bed, wakeDate, undefined, personalCycleLength) as Classification;

  const genericDist = boundaryDist(genericClass, 90);
  const learnedDist = boundaryDist(learnedClass, personalCycleLength);
  const improvement = genericDist - learnedDist;

  const gc = RAG[genericClass.color] ?? RAG.amber;
  const lc = RAG[learnedClass.color] ?? RAG.green;

  const cyclesLabel = personalCycleLength === 90
    ? 'Matches generic'
    : personalCycleLength > 90
    ? `+${personalCycleLength - 90}m longer`
    : `${90 - personalCycleLength}m shorter`;

  return (
    <div
      className="rounded-2xl bg-card card-shadow overflow-hidden"
      style={{ border: '1px solid var(--apple-separator)' }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[15px]">✦</span>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--foreground)' }}>
            Rhythm Comparison
          </p>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-[0.08em]"
          style={{ background: 'var(--apple-green)', color: '#fff' }}
        >
          Live
        </span>
      </div>

      {/* Two-column comparison */}
      <div className="grid grid-cols-2 gap-px mx-5 mb-4 rounded-2xl overflow-hidden" style={{ background: 'var(--apple-separator)' }}>
        {/* Generic side */}
        <div className="px-4 py-4" style={{ background: 'var(--card)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-3" style={{ color: 'var(--muted-foreground)' }}>
            Generic 90m
          </p>
          <p className="text-[15px] font-semibold mb-2" style={{ fontFamily: 'var(--code-font)', fontVariantNumeric: 'tabular-nums', color: 'var(--foreground)' }}>
            {formatTime12(wakeDate)}
          </p>
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full mb-2"
            style={{ background: gc.bg, border: `1px solid ${gc.border}` }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: gc.color }} />
            <span className="text-[11px] font-semibold" style={{ color: gc.color }}>
              {genericClass.label}
            </span>
          </div>
          <p className="text-[11px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
            {genericDist}m from edge
          </p>
        </div>

        {/* Circathym side */}
        <div
          className="px-4 py-4"
          style={{
            background: 'var(--card)',
            borderLeft: `2px solid var(--apple-blue)`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--apple-blue)' }}>
              Circathym {personalCycleLength}m
            </p>
            <span className="text-[9px] font-semibold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded" style={{ background: 'var(--accent)', color: 'var(--apple-blue)' }}>
              {cyclesLabel}
            </span>
          </div>
          <p className="text-[15px] font-semibold mb-2" style={{ fontFamily: 'var(--code-font)', fontVariantNumeric: 'tabular-nums', color: 'var(--foreground)' }}>
            {formatTime12(wakeDate)}
          </p>
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full mb-2"
            style={{ background: lc.bg, border: `1px solid ${lc.border}` }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: lc.color }} />
            <span className="text-[11px] font-semibold" style={{ color: lc.color }}>
              {learnedClass.label}
            </span>
          </div>
          <p className="text-[11px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
            {learnedDist}m from edge
          </p>
        </div>
      </div>

      {/* Improvement callout */}
      {improvement > 0 && (
        <div
          className="mx-5 mb-4 rounded-xl px-4 py-3"
          style={{ background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.25)' }}
        >
          <p className="text-[13px] font-semibold" style={{ color: '#34C759' }}>
            ↑ {improvement}m closer to your real cycle boundary
          </p>
          <p className="text-[11px] font-medium mt-0.5" style={{ color: '#34C759', opacity: 0.75 }}>
            That's the difference personalization makes.
          </p>
        </div>
      )}

      {improvement === 0 && personalCycleLength !== 90 && (
        <div
          className="mx-5 mb-4 rounded-xl px-4 py-3"
          style={{ background: 'var(--accent)', border: '1px solid rgba(0,122,255,0.2)' }}
        >
          <p className="text-[13px] font-semibold" style={{ color: 'var(--apple-blue)' }}>
            Both models agree — this wake time is ideal.
          </p>
        </div>
      )}

      {/* Evidence footer */}
      <div
        className="px-5 pb-5 pt-3"
        style={{ borderTop: '1px solid var(--apple-separator)' }}
      >
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
          <EvidencePill icon="🌙" label={`${sleepLog.length} nights`} />
          <EvidencePill icon="⭐" label={`${goodWakes} quality wakes`} />
          <EvidencePill icon="📈" label={`${confidence.label} confidence`} color={confidence.label === 'High' ? 'var(--apple-green)' : confidence.label === 'Medium' ? 'var(--apple-orange)' : 'var(--muted-foreground)'} />
        </div>
        <p className="text-[10px] font-medium" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>
          Based on wake quality ratings, not medical sleep staging.
        </p>
      </div>
    </div>
  );
}

function EvidencePill({ icon, label, color }: { icon: string; label: string; color?: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-[11px]">{icon}</span>
      <span
        className="text-[11px] font-semibold"
        style={{ color: color || 'var(--muted-foreground)' }}
      >
        {label}
      </span>
    </span>
  );
}
