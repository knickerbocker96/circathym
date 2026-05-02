import React from 'react';
import './TimePicker.css';

export default function TimePicker({ value, onChange, label = 'Wake time' }) {
  return (
    <label className="timepicker">
      <span className="tp-label">{label}</span>
      <input
        className="tp-input"
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
