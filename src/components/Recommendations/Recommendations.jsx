import React from 'react';
import './Recommendations.css';
import { formatTime12 } from '../../utils/timeUtils';

export default function Recommendations({ times = [], onSelect }) {
  return (
    <div className="recommendations">
      <strong>Recommended Wake Times</strong>
      <div className="recommendations-list">
        {times.map((item, i) => (
          <button
            key={i}
            className={`recommendation-button recommendation-button--${item.color}`}
            type="button"
            onClick={() => onSelect?.(item)}
          >
            {formatTime12(item.date)}
          </button>
        ))}
      </div>
    </div>
  );
}
