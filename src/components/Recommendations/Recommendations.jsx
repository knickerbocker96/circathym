import React from 'react';
import './Recommendations.css';
import { formatTime12 } from '../../utils/timeUtils';

export default function Recommendations({ times = [], onSelect }) {
  return (
    <div className="recommendations">
      <strong>Recommended wake times</strong>
      <div className="recommendations-list">
        {times.map((t, i) => (
          <button key={i} className="recommendation-button" type="button" onClick={() => onSelect?.(t)}>
            {formatTime12(t)}
          </button>
        ))}
      </div>
    </div>
  );
}
