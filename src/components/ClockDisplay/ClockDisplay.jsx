import React from 'react';
import './ClockDisplay.css';

export default function ClockDisplay({ label }) {
  return (
    <div className="clock-display">
      {label && <div className="clock-label">{label}</div>}
    </div>
  );
}
