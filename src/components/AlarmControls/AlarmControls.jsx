import React from 'react';
import './AlarmControls.css';

export default function AlarmControls({ onSet, onClear }) {
  return (
    <div className="alarm-controls">
      <button className="btn" onClick={onSet}>Set Alarm</button>
      <button className="btn muted" onClick={onClear}>Clear</button>
    </div>
  );
}
