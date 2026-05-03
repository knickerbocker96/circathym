'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import useSleepCoach from '@/hooks/useSleepCoach';

interface Entry { bedtime: string; waketime: string; rating: number; }
interface Props { personalCycleLength: number | null; sleepLog: Entry[]; }

const SUGGESTIONS = [
  "I have a 9am class tomorrow, when should I sleep?",
  "Why do I keep waking up groggy?",
  "How can I shift my schedule earlier?",
];

export default function SleepCoach({ personalCycleLength, sleepLog }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { ask, response, loading, error } = useSleepCoach(personalCycleLength, sleepLog);

  function handleSend() {
    const msg = input.trim();
    if (!msg) return;
    ask(msg);
    setInput('');
  }

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
        <span className="text-[15px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--foreground)' }}>
          Sleep Coach
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
        <div className="px-5 pb-5 space-y-3" style={{ borderTop: '1px solid var(--apple-separator)' }}>
          <div className="space-y-2 pt-3">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setInput(s)}
                className="w-full text-left text-[13px] font-medium px-3 py-2.5 rounded-xl transition-all duration-150"
                style={{
                  background: 'var(--secondary)',
                  color: 'var(--muted-foreground)',
                  border: '1px solid transparent',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--apple-separator)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask your sleep coach…"
              className="text-[13px] h-10 rounded-xl"
              style={{ background: 'var(--secondary)', border: '1px solid var(--apple-separator)', fontFamily: 'inherit' }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-4 h-10 rounded-xl text-[13px] font-semibold transition-all duration-150 disabled:opacity-30 shrink-0"
              style={{ background: 'var(--apple-blue)', color: '#FFFFFF' }}
            >
              {loading ? '…' : 'Ask'}
            </button>
          </div>

          {error && (
            <p className="text-[13px]" style={{ color: 'var(--destructive)' }}>{error}</p>
          )}

          {response && (
            <div
              className="rounded-xl p-4 space-y-1.5"
              style={{ background: 'var(--sleep-blue-faint)', border: '1px solid rgba(0,122,255,0.15)' }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--apple-blue)' }}>
                Coach
              </span>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--foreground)' }}>
                {response}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
