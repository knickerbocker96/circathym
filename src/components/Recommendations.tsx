'use client';

import { formatTime12 } from '@/utils/timeUtils';

interface Rec { date: Date; color: 'green' | 'amber' | 'red'; }
interface Props { times: Rec[]; onSelect: (r: Rec) => void; cycleLength: number; bedDate: Date | null; }

const RAG: Record<string, { bg: string; border: string; text: string }> = {
  green: {
    bg: 'rgba(52, 199, 89, 0.1)',
    border: 'rgba(52, 199, 89, 0.35)',
    text: '#34C759',
  },
  amber: {
    bg: 'rgba(255, 149, 0, 0.1)',
    border: 'rgba(255, 149, 0, 0.35)',
    text: '#FF9500',
  },
  red: {
    bg: 'rgba(255, 59, 48, 0.08)',
    border: 'rgba(255, 59, 48, 0.3)',
    text: '#FF3B30',
  },
};

export default function Recommendations({ times, onSelect, cycleLength, bedDate }: Props) {
  if (!times.length) return null;
  return (
    <div className="rounded-2xl bg-card card-shadow p-5 space-y-3" style={{ border: '1px solid var(--apple-separator)' }}>
      <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-center" style={{ color: 'var(--muted-foreground)' }}>
        Recommended Wake Times
      </p>
      <div className="grid grid-cols-2 gap-2">
        {times.map((item, i) => {
          const c = RAG[item.color] ?? RAG.green;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(item)}
              className="min-h-[60px] rounded-2xl px-3 py-3 text-left transition-all duration-150 active:scale-[0.97]"
              style={{ background: c.bg, border: `1.5px solid ${c.border}` }}
            >
              <span className="block text-[17px] font-semibold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif', fontVariantNumeric: 'tabular-nums', color: c.text }}>
                {formatTime12(item.date)}
              </span>
              <span className="block text-[11px] font-medium mt-0.5" style={{ color: c.text, opacity: 0.7 }}>
                {getReason(item, cycleLength, bedDate)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getReason(item: Rec, cycleLength: number, bedDate: Date | null) {
  if (!bedDate) return item.color === 'green' ? 'cycle edge' : 'near edge';
  const elapsed = Math.max(0, (item.date.getTime() - bedDate.getTime()) / 60000 - 15);
  const pos = ((elapsed % cycleLength) + cycleLength) % cycleLength;
  const distance = Math.round(Math.min(pos, cycleLength - pos));
  return item.color === 'green' ? `${distance}m from boundary` : `buffer ${distance}m`;
}
