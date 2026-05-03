'use client';

import { useEffect, useRef } from 'react';

const STEP = 5;
const pad = (n: number) => String(n).padStart(2, '0');

const SF_DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--code-font)',
  fontVariantNumeric: 'tabular-nums',
};

function toHour24(h12: number, period: string) {
  if (period === 'AM') return h12 === 12 ? 0 : h12;
  return h12 === 12 ? 12 : h12 + 12;
}

interface Props { value: string; onChange: (v: string) => void; label?: string; }

export default function TimePicker({ value, onChange, label = 'Wake Time' }: Props) {
  const [h24, min] = value.split(':').map(Number);
  const snapped = Math.round(min / STEP) * STEP % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  const other = period === 'AM' ? 'PM' : 'AM';
  const prevH = ((h12 - 2 + 12) % 12) + 1;
  const nextH = (h12 % 12) + 1;
  const prevM = (snapped - STEP + 60) % 60;
  const nextM = (snapped + STEP) % 60;

  const emit = (h: number, m: number) => onChange(`${pad(h)}:${pad(m)}`);
  const incHour = () => emit(toHour24(nextH, period), snapped);
  const decHour = () => emit(toHour24(prevH, period), snapped);
  const incMin  = () => emit(h24, nextM);
  const decMin  = () => emit(h24, prevM);
  const togPeriod = () => emit(toHour24(h12, other), snapped);

  return (
    <section aria-label={label}>
      <p
        className="text-[11px] font-semibold tracking-[0.08em] uppercase text-center mb-5"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {label}
      </p>

      <div className="relative">
        {/* Drum-roll selection highlight */}
        <div
          className="absolute inset-x-4 pointer-events-none"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            height: 44,
            borderRadius: 10,
            background: 'var(--secondary)',
            zIndex: 1,
          }}
        />
        {/* Separator lines */}
        <div className="absolute inset-x-0 pointer-events-none" style={{ top: '50%', transform: 'translateY(-22px)', borderTop: '0.5px solid var(--apple-separator)', zIndex: 2 }} />
        <div className="absolute inset-x-0 pointer-events-none" style={{ top: '50%', transform: 'translateY(22px)',  borderTop: '0.5px solid var(--apple-separator)', zIndex: 2 }} />
        {/* Top / bottom fade */}
        <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: '35%', background: 'linear-gradient(to bottom, var(--card) 10%, transparent 100%)', zIndex: 3 }} />
        <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: '35%', background: 'linear-gradient(to top,   var(--card) 10%, transparent 100%)', zIndex: 3 }} />

        {/* Wheels */}
        <div className="relative flex items-center justify-center select-none" style={{ zIndex: 4, gap: '0.1rem' }}>

          <Column onUp={incHour} onDown={decHour} width={72}>
            <Slot dim>{prevH}</Slot>
            <Slot large>{h12}</Slot>
            <Slot dim>{nextH}</Slot>
          </Column>

          {/* Colon */}
          <span style={{ ...SF_DISPLAY, fontSize: '2.5rem', fontWeight: 300, lineHeight: 1, color: 'var(--foreground)', paddingBottom: 4, width: 20, textAlign: 'center' as const }}>:</span>

          <Column onUp={incMin} onDown={decMin} width={72}>
            <Slot dim>{pad(prevM)}</Slot>
            <Slot large>{pad(snapped)}</Slot>
            <Slot dim>{pad(nextM)}</Slot>
          </Column>

          {/* AM / PM */}
          <Column onUp={togPeriod} onDown={togPeriod} width={52} style={{ marginLeft: 4 }}>
            <Slot>&nbsp;</Slot>
            <Slot period>{period}</Slot>
            <Slot dim period>{other}</Slot>
          </Column>

        </div>
      </div>
    </section>
  );
}

/* ── Scrollable column ── */
function Column({
  children,
  onUp,
  onDown,
  width,
  style,
}: {
  children: React.ReactNode;
  onUp: () => void;
  onDown: () => void;
  width: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  /* Non-passive wheel listener so preventDefault() actually works */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      if (e.deltaY < 0) onUp();
      else onDown();
    }
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onUp, onDown]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowUp')   { e.preventDefault(); onUp(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); onDown(); }
  }

  return (
    <div
      ref={ref}
      tabIndex={0}
      onKeyDown={handleKey}
      style={{ width, cursor: 'ns-resize', outline: 'none', ...style }}
      className="flex flex-col items-center focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
    >
      {children}
    </div>
  );
}

/* ── Single drum-roll slot ── */
function Slot({
  children,
  dim,
  large,
  period,
}: {
  children: React.ReactNode;
  dim?: boolean;
  large?: boolean;
  period?: boolean;
}) {
  const fontSize = large ? '3.4rem' : period ? '1.5rem' : '2rem';
  const fontWeight = large ? 300 : 300;

  return (
    <div
      style={{
        ...SF_DISPLAY,
        fontSize,
        fontWeight,
        height: 44,
        lineHeight: '44px',
        color: 'var(--foreground)',
        opacity: dim ? 0.22 : 1,
        width: '100%',
        textAlign: 'center',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
}
