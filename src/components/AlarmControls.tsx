'use client';

interface Props {
  alarmEnabled: boolean;
  snoozeEnabled: boolean;
  isRinging: boolean;
  scheduledLabel: string | null;
  alarmSettings: { tone: string; volume: number; fadeIn: boolean };
  snoozeOptions: number[];
  onAlarmToggle: () => void;
  onSnoozeToggle: () => void;
  onAlarmSettingsChange: (settings: { tone: string; volume: number; fadeIn: boolean }) => void;
  onSnooze: (m: number) => void;
  onClear: () => void;
  onStop: () => void;
  onTestAlarm: () => void;
}

const TONES = [
  { id: 'gentle', label: 'Gentle Rise' },
  { id: 'classic', label: 'Classic Bell' },
  { id: 'focus', label: 'Focus Pulse' },
  { id: 'emergency', label: 'Emergency' },
];

export default function AlarmControls({
  alarmEnabled, snoozeEnabled, isRinging, scheduledLabel, alarmSettings,
  snoozeOptions, onAlarmToggle, onSnoozeToggle, onAlarmSettingsChange, onSnooze, onClear, onStop, onTestAlarm,
}: Props) {
  function update(partial: Partial<typeof alarmSettings>) {
    onAlarmSettingsChange({ ...alarmSettings, ...partial });
  }

  const sliderBg = `linear-gradient(to right, var(--apple-blue) 0%, var(--apple-blue) ${alarmSettings.volume * 100}%, var(--secondary) ${alarmSettings.volume * 100}%, var(--secondary) 100%)`;

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-center" style={{ color: 'var(--muted-foreground)' }}>
        Alarm
      </p>

      {scheduledLabel && (
        <p className="text-center text-[13px] font-semibold" style={{ color: 'var(--apple-blue)' }}>
          {scheduledLabel}
        </p>
      )}

      {/* iOS toggle rows */}
      <div className="space-y-0" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--apple-separator)' }}>
        <SwitchRow
          label="Alarm"
          active={alarmEnabled}
          onChange={onAlarmToggle}
          color="var(--apple-green)"
        />
        <div style={{ height: 1, background: 'var(--apple-separator)', marginLeft: 16 }} />
        <SwitchRow
          label="Smart Snooze"
          active={snoozeEnabled}
          onChange={onSnoozeToggle}
          color="var(--apple-orange)"
        />
      </div>

      {/* Settings panel */}
      <div className="rounded-xl p-4 space-y-4" style={{ background: 'var(--secondary)' }}>
        {/* Tone segmented control */}
        <div>
          <p className="text-[11px] font-semibold tracking-[0.06em] uppercase mb-2" style={{ color: 'var(--muted-foreground)' }}>
            Tone
          </p>
          <div className="flex rounded-xl overflow-hidden p-1 gap-1" style={{ background: 'var(--apple-fill)' }}>
            {TONES.map(tone => (
              <button
                key={tone.id}
                type="button"
                onClick={() => update({ tone: tone.id })}
                className="flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-150"
                style={{
                  background: alarmSettings.tone === tone.id ? 'var(--card)' : 'transparent',
                  color: alarmSettings.tone === tone.id ? 'var(--foreground)' : 'var(--muted-foreground)',
                  boxShadow: alarmSettings.tone === tone.id ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                }}
              >
                {tone.label}
              </button>
            ))}
          </div>
        </div>

        {/* Volume slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-[11px] font-semibold tracking-[0.06em] uppercase" style={{ color: 'var(--muted-foreground)' }}>
              Volume
            </p>
            <p className="text-[11px] font-semibold" style={{ fontFamily: 'var(--code-font)', fontVariantNumeric: 'tabular-nums', color: 'var(--apple-blue)' }}>
              {Math.round(alarmSettings.volume * 100)}%
            </p>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={alarmSettings.volume}
            onChange={e => update({ volume: Number(e.target.value) })}
            className="w-full"
            style={{ background: sliderBg }}
          />
        </div>

        {/* Fade in + test */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => update({ fadeIn: !alarmSettings.fadeIn })}
            className="flex-1 h-9 rounded-xl text-[13px] font-semibold transition-all duration-150"
            style={{
              background: alarmSettings.fadeIn ? 'var(--apple-blue)' : 'var(--card)',
              color: alarmSettings.fadeIn ? '#FFFFFF' : 'var(--muted-foreground)',
            }}
          >
            Fade In
          </button>
          <button
            type="button"
            onClick={onTestAlarm}
            className="flex-1 h-9 rounded-xl text-[13px] font-semibold transition-all duration-150"
            style={{ background: 'var(--card)', color: 'var(--apple-blue)' }}
          >
            Test
          </button>
        </div>
      </div>

      {/* Ringing state */}
      {isRinging && (
        <div
          className="rounded-xl p-4 space-y-3"
          role="status"
          aria-live="polite"
          style={{ background: 'rgba(255, 59, 48, 0.08)', border: '1px solid rgba(255, 59, 48, 0.25)' }}
        >
          <p className="text-[13px] font-semibold text-center" style={{ color: 'var(--apple-red)' }}>
            Alarm Ringing
          </p>
          {snoozeEnabled && (
            <>
              <p className="text-[11px] text-center font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Snooze to next cycle edge
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {snoozeOptions.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onSnooze(m)}
                    className="h-9 rounded-xl text-[12px] font-semibold transition-all duration-150"
                    style={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--apple-separator)' }}
                  >
                    +{m}m
                  </button>
                ))}
              </div>
            </>
          )}
          <button
            type="button"
            onClick={onStop}
            className="w-full h-10 rounded-xl text-[15px] font-semibold"
            style={{ background: 'var(--apple-red)', color: '#FFFFFF' }}
          >
            Stop &amp; Log Wake
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onClear}
        className="w-full h-9 rounded-xl text-[13px] font-medium transition-all duration-150"
        style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
      >
        Clear
      </button>
    </div>
  );
}

function SwitchRow({ label, active, onChange, color }: {
  label: string; active: boolean; onChange: () => void; color: string;
}) {
  return (
    <div
      className="flex items-center justify-between px-4"
      style={{ height: 48, background: 'var(--card)' }}
    >
      <span className="text-[15px] font-normal" style={{ color: 'var(--foreground)' }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        onClick={onChange}
        className="relative shrink-0 transition-all duration-200"
        style={{
          width: 51,
          height: 31,
          borderRadius: 15.5,
          background: active ? color : 'rgba(120,120,128,0.32)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span
          className="absolute transition-transform duration-200"
          style={{
            top: 2,
            left: 2,
            width: 27,
            height: 27,
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: '0 2px 4px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.06)',
            transform: active ? 'translateX(20px)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  );
}
