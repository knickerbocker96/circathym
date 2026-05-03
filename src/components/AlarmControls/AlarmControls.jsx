import React from 'react';
import './AlarmControls.css';

export default function AlarmControls({
  alarmEnabled,
  snoozeEnabled,
  isRinging,
  snoozeOptions,
  onAlarmToggle,
  onSnoozeToggle,
  onSnooze,
  onClear,
}) {
  return (
    <div className="alarm-controls">
      <div className="alarm-toggle-row">
        <button
          type="button"
          className={alarmEnabled ? 'alarm-toggle alarm-toggle--active' : 'alarm-toggle'}
          onClick={onAlarmToggle}
          aria-pressed={alarmEnabled}
        >
          Alarm {alarmEnabled ? 'On' : 'Off'}
        </button>
        <button
          type="button"
          className={snoozeEnabled ? 'alarm-toggle alarm-toggle--active' : 'alarm-toggle'}
          onClick={onSnoozeToggle}
          aria-pressed={snoozeEnabled}
        >
          Snooze {snoozeEnabled ? 'On' : 'Off'}
        </button>
      </div>

      {isRinging && (
        <div className="ringing-panel" role="status" aria-live="polite">
          <div className="ringing-label">Alarm ringing</div>
          {snoozeEnabled && (
            <div className="snooze-grid" aria-label="Snooze options">
              {snoozeOptions.map((minutes) => (
                <button
                  type="button"
                  className="snooze-option"
                  key={minutes}
                  onClick={() => onSnooze(minutes)}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button type="button" className="btn muted" onClick={onClear}>
        Clear
      </button>
    </div>
  );
}
