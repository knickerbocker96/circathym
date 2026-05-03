import React from 'react';
import './TimePicker.css';

const MINUTE_STEP = 5;

export default function TimePicker({ value, onChange, label = 'Wake Time' }) {
  const [hour24, minute] = value.split(':').map(Number);
  const snappedMinute = snapMinute(minute);
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;

  function setHour12(nextHour12) {
    const normalizedHour = ((nextHour12 - 1 + 12) % 12) + 1;
    const nextHour24 = toHour24(normalizedHour, period);
    onChange(`${pad(nextHour24)}:${pad(snappedMinute)}`);
  }

  function setMinute(nextMinute) {
    const normalizedMinute = ((nextMinute % 60) + 60) % 60;
    onChange(`${pad(hour24)}:${pad(normalizedMinute)}`);
  }

  function setPeriod(nextPeriod) {
    onChange(`${pad(toHour24(hour12, nextPeriod))}:${pad(snappedMinute)}`);
  }

  const previousHour = wrapHour(hour12 - 1);
  const nextHour = wrapHour(hour12 + 1);
  const previousMinute = (snappedMinute - MINUTE_STEP + 60) % 60;
  const nextMinute = (snappedMinute + MINUTE_STEP) % 60;
  const otherPeriod = period === 'AM' ? 'PM' : 'AM';

  return (
    <section className="timepicker" aria-label={label}>
      <div className="tp-label">{label}</div>
      <div className="alarm-wheel">
        <div className="wheel-column" aria-label="Hour picker">
          <button type="button" className="wheel-option wheel-option--dim" onClick={() => setHour12(previousHour)}>
            {previousHour}
          </button>
          <button type="button" className="wheel-option wheel-option--active" onClick={() => setHour12(nextHour)}>
            {hour12}
          </button>
          <button type="button" className="wheel-option wheel-option--dim" onClick={() => setHour12(nextHour)}>
            {nextHour}
          </button>
        </div>

        <div className="wheel-colon">:</div>

        <div className="wheel-column" aria-label="Minute picker">
          <button type="button" className="wheel-option wheel-option--dim" onClick={() => setMinute(previousMinute)}>
            {pad(previousMinute)}
          </button>
          <button type="button" className="wheel-option wheel-option--active" onClick={() => setMinute(nextMinute)}>
            {pad(snappedMinute)}
          </button>
          <button type="button" className="wheel-option wheel-option--dim" onClick={() => setMinute(nextMinute)}>
            {pad(nextMinute)}
          </button>
        </div>

        <div className="wheel-column wheel-column--period" aria-label="AM PM picker">
          <button type="button" className="wheel-option wheel-option--spacer" aria-hidden="true" tabIndex="-1">
            {otherPeriod}
          </button>
          <button type="button" className="wheel-option wheel-option--active wheel-option--period" onClick={() => setPeriod(otherPeriod)}>
            {period}
          </button>
          <button type="button" className="wheel-option wheel-option--dim wheel-option--period" onClick={() => setPeriod(otherPeriod)}>
            {otherPeriod}
          </button>
        </div>
      </div>
    </section>
  );
}

function toHour24(hour12, period) {
  if (period === 'AM') {
    return hour12 === 12 ? 0 : hour12;
  }

  return hour12 === 12 ? 12 : hour12 + 12;
}

function wrapHour(hour) {
  return ((hour - 1 + 12) % 12) + 1;
}

function snapMinute(minute) {
  return Math.round(minute / MINUTE_STEP) * MINUTE_STEP % 60;
}

function pad(value) {
  return String(value).padStart(2, '0');
}
