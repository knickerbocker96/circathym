'use client';

import { useState } from 'react';

const RATINGS = [
  { value: 1, emoji: '😵', label: 'Wrecked' },
  { value: 2, emoji: '😴', label: 'Groggy' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

interface Props {
  defaultBedtime: string;
  defaultWaketime: string;
  onLog: (entry: { rating: number; bedtime: string; waketime: string }) => void;
  onDismiss: () => void;
}

export default function WakeLogger({ defaultBedtime, defaultWaketime, onLog, onDismiss }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [bedtime, setBedtime] = useState(defaultBedtime);
  const [waketime, setWaketime] = useState(defaultWaketime);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (selected === null) return;
    onLog({ rating: selected, bedtime, waketime });
    setSaved(true);
    setTimeout(onDismiss, 1000);
  }

  return (
    <div className="rounded-2xl bg-card card-shadow p-5 space-y-4" style={{ border: '1px solid var(--apple-separator)' }}>
      {saved ? (
        <p className="text-center text-[15px] font-semibold py-2" style={{ color: 'var(--apple-green)' }}>
          Sleep data updated.
        </p>
      ) : (
        <>
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-center" style={{ color: 'var(--muted-foreground)' }}>
            How Did You Wake Up?
          </p>

          <div className="grid grid-cols-2 gap-3">
            <TimeField label="Bedtime" value={bedtime} onChange={setBedtime} />
            <TimeField label="Woke Up" value={waketime} onChange={setWaketime} />
          </div>

          <div className="flex gap-2 justify-center">
            {RATINGS.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelected(r.value)}
                className="flex flex-col items-center gap-1 flex-1 py-3 rounded-2xl transition-all duration-150 active:scale-95"
                style={{
                  background: selected === r.value ? 'var(--accent)' : 'var(--secondary)',
                  border: selected === r.value ? '1.5px solid var(--apple-blue)' : '1.5px solid transparent',
                }}
              >
                <span className="text-[22px] leading-none">{r.emoji}</span>
                <span className="text-[10px] font-semibold" style={{ color: selected === r.value ? 'var(--apple-blue)' : 'var(--muted-foreground)' }}>
                  {r.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={selected === null}
              className="flex-1 h-11 rounded-xl text-[15px] font-semibold transition-all duration-150 disabled:opacity-30"
              style={{ background: 'var(--apple-blue)', color: '#FFFFFF' }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="px-5 h-11 rounded-xl text-[15px] font-medium transition-all duration-150"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
            >
              Skip
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="space-y-1.5">
      <span className="text-[11px] font-semibold tracking-[0.06em] uppercase block" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </span>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-xl text-[13px] font-semibold"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
          fontVariantNumeric: 'tabular-nums',
          background: 'var(--secondary)',
          border: '1px solid var(--apple-separator)',
          color: 'var(--foreground)',
          outline: 'none',
        }}
      />
    </label>
  );
}
