import React from 'react';
import './ClockDisplay.css';

export default function ClockDisplay({ wakeDate, label }) {
  const time = wakeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="clock-display">
      <div className="clock-time">{time}</div>
      {label && <div className="clock-label">{label}</div>}
    </div>
  );
}
