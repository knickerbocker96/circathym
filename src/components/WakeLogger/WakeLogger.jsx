import React, { useState } from 'react';
import './WakeLogger.css';

const RATINGS = [
  { value: 1, label: 'Wrecked' },
  { value: 2, label: 'Groggy' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Great' },
];

export default function WakeLogger({ defaultBedtime, defaultWaketime, logCount = 0, onLog, onDismiss }) {
  const [selected, setSelected] = useState(null);
  const [bedtime, setBedtime] = useState(defaultBedtime);
  const [waketime, setWaketime] = useState(defaultWaketime);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (selected === null) return;

    onLog({ rating: selected, bedtime, waketime });
    setSaved(true);
    window.setTimeout(onDismiss, 900);
  }

  return (
    <section className="wake-logger">
      {saved ? (
        <p className="wake-logger__saved">Wake quality saved</p>
      ) : (
        <>
          <div className="wake-logger__header">
            <strong>Wake Quality</strong>
            <span>{logCount} logs</span>
          </div>

          <div className="wake-logger__times">
            <TimeField label="Bedtime" value={bedtime} onChange={setBedtime} />
            <TimeField label="Woke Up" value={waketime} onChange={setWaketime} />
          </div>

          <div className="wake-logger__ratings">
            {RATINGS.map((rating) => (
              <button
                key={rating.value}
                type="button"
                className={selected === rating.value ? 'wake-rating wake-rating--active' : 'wake-rating'}
                onClick={() => setSelected(rating.value)}
              >
                <span>{rating.value}</span>
                <small>{rating.label}</small>
              </button>
            ))}
          </div>

          <div className="wake-logger__actions">
            <button type="button" className="wake-logger__save" disabled={selected === null} onClick={handleSave}>
              Save
            </button>
            <button type="button" className="wake-logger__skip" onClick={onDismiss}>
              Skip
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function TimeField({ label, value, onChange }) {
  return (
    <label className="wake-time-field">
      <span>{label}</span>
      <input type="time" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
