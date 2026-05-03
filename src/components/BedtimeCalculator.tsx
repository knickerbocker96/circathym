'use client';

import { useState } from 'react';
import { recommendBedtimes } from '@/logic/bedtimeCalculator';
import { getNextTimeInTimeZone, formatTime12 } from '@/utils/timeUtils';

interface BedtimeOption {
  bedDate: Date;
  cycleCount: number;
}

interface Props {
  personalCycleLength: number | null;
  onUsePlan: (option: BedtimeOption, wakeByDate: Date) => void;
}

export default function BedtimeCalculator({ personalCycleLength, onUsePlan }: Props) {
  const [open, setOpen] = useState(false);
  const [wakeBy, setWakeBy] = useState('08:00');

  const cycleLength = personalCycleLength || 90;
  const wakeByDate = getNextTimeInTimeZone(wakeBy, new Date());
  const options = recommendBedtimes(wakeByDate, cycleLength);

  return (
    <div
      className="rounded-2xl bg-card card-shadow overflow-hidden"
      style={{ border: '1px solid var(--apple-separator)' }}
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors duration-150"
      >
        <span className="text-[15px] font-semibold" style={{ color: 'var(--foreground)' }}>
          Bedtime Calculator
        </span>
        <span
          className="text-[11px] font-medium transition-transform duration-200"
          style={{
            color: 'var(--apple-blue)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'inline-block',
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid var(--apple-separator)' }}>
          <div className="space-y-2 pt-4">
            <label
              className="text-[11px] font-semibold tracking-[0.06em] uppercase block"
              htmlFor="wake-by"
              style={{ color: 'var(--muted-foreground)' }}
            >
              I need to be up by
            </label>
            <input
              id="wake-by"
              type="time"
              value={wakeBy}
              onChange={e => setWakeBy(e.target.value)}
              className="w-full h-10 px-3 rounded-xl text-[15px] font-semibold"
              style={{
                fontFamily: 'var(--code-font)',
                fontVariantNumeric: 'tabular-nums',
                background: 'var(--secondary)',
                border: '1px solid var(--apple-separator)',
                color: 'var(--foreground)',
                outline: 'none',
              }}
            />
          </div>

          <p className="text-[11px] font-semibold tracking-[0.06em] uppercase" style={{ color: 'var(--muted-foreground)' }}>
            Go to sleep at — {cycleLength}m cycles
          </p>

          <div className="space-y-2">
            {options.map(({ bedDate, cycleCount }) => (
              <button
                key={cycleCount}
                type="button"
                onClick={() => onUsePlan({ bedDate, cycleCount }, wakeByDate)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-left transition-all duration-150 active:scale-[0.98]"
                style={{
                  background: 'var(--secondary)',
                  border: '1px solid transparent',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--apple-blue)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--secondary)';
                }}
              >
                <span>
                  <span className="block text-[17px] font-semibold" style={{ fontFamily: 'var(--code-font)', fontVariantNumeric: 'tabular-nums', color: 'var(--foreground)' }}>
                    {formatTime12(bedDate)}
                  </span>
                  <span className="block text-[11px] font-medium mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    aligns with your {cycleLength}m rhythm
                  </span>
                </span>
                <span className="text-right shrink-0">
                  <span className="block text-[11px] font-semibold" style={{ color: 'var(--apple-blue)' }}>
                    Use plan
                  </span>
                  <span className="block text-[11px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    {cycleCount} cycles · {(cycleCount * cycleLength / 60).toFixed(1)}h
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
