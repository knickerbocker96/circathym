import React from 'react';
import './Recommendations.css';

export default function Recommendations({ times = [] }) {
  return (
    <div className="recommendations">
      <strong>Recommended wake times</strong>
      <ul>
        {times.map((t, i) => (
          <li key={i}>{t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</li>
        ))}
      </ul>
    </div>
  );
}
