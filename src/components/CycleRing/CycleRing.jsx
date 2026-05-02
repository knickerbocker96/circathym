import React from 'react';
import './CycleRing.css';

function polarToCartesian(cx, cy, radius, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}
function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export default function CycleRing({
  size = 260,
  strokeWidth = 18,
  segments = 6,
  activeIndex = 0,
  activeColor = '#22c55e',
  baseColor = '#e6e6e6',
  gapDeg = 2,
}) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - strokeWidth) / 2;
  const segAngle = 360 / segments;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="cycle-ring" aria-hidden>
      {Array.from({ length: segments }).map((_, i) => {
        const start = -90 + i * segAngle + gapDeg / 2;
        const end = start + segAngle - gapDeg;
        const path = describeArc(cx, cy, radius, start, end);
        const stroke = i === activeIndex ? activeColor : baseColor;
        return (
          <path
            key={i}
            d={path}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />
        );
      })}
      <circle cx={cx} cy={cy} r={radius - strokeWidth - 6} fill="white" />
    </svg>
  );
}
