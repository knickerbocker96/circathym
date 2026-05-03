import React from 'react';
import './CycleRing.css';
import { formatTime12, getTimeZoneParts } from '../../utils/timeUtils';

export default function CycleRing({ currentTime, wakeDate, ragColor = '#22c55e', size = 260 }) {
  const parts = getTimeZoneParts(currentTime);
  const digitalTime = formatTime12(currentTime, undefined, true);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.44;
  const hourAngle = ((parts.hour % 12) + parts.minute / 60) * 30;
  const minuteAngle = (parts.minute + parts.second / 60) * 6;
  const secondAngle = parts.second * 6;
  const currentClockAngle = ((parts.hour % 12) * 60 + parts.minute + parts.second / 60) * 0.5;
  const durationMinutes = wakeDate ? Math.max(0, (wakeDate - currentTime) / 60000) : 0;
  const sleepAngle = Math.min(durationMinutes * 0.5, 359.9);
  const finalSegmentAngle = Math.min(sleepAngle, 45);
  const sleepStartAngle = currentClockAngle;
  const sleepEndAngle = sleepStartAngle + sleepAngle;
  const finalStartAngle = sleepEndAngle - finalSegmentAngle;

  const ticks = Array.from({ length: 60 }, (_, index) => {
    const isHourTick = index % 5 === 0;
    const angle = index * 6;
    const outer = polarToCartesian(cx, cy, radius, angle);
    const inner = polarToCartesian(cx, cy, radius - (isHourTick ? 14 : 7), angle);

    return (
      <line
        key={index}
        className={isHourTick ? 'clock-tick clock-tick--hour' : 'clock-tick'}
        x1={inner.x}
        y1={inner.y}
        x2={outer.x}
        y2={outer.y}
      />
    );
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="cycle-ring analog-clock"
      role="img"
      aria-label="Live analog clock"
    >
      <circle className="clock-face" cx={cx} cy={cy} r={radius} />
      {sleepAngle > 0 && (
        <path
          className="sleep-window sleep-window--duration"
          d={describePieSlice(cx, cy, radius - 22, sleepStartAngle, sleepEndAngle)}
        />
      )}
      {finalSegmentAngle > 0 && (
        <path
          className="sleep-window sleep-window--final"
          d={describePieSlice(cx, cy, radius - 22, finalStartAngle, sleepEndAngle)}
          fill={ragColor}
        />
      )}
      {ticks}
      <ClockHand cx={cx} cy={cy} angle={hourAngle} length={radius * 0.5} className="clock-hand clock-hand--hour" />
      <ClockHand cx={cx} cy={cy} angle={minuteAngle} length={radius * 0.72} className="clock-hand clock-hand--minute" />
      <ClockHand cx={cx} cy={cy} angle={secondAngle} length={radius * 0.78} className="clock-hand clock-hand--second" />
      <circle className="clock-pin" cx={cx} cy={cy} r="5" />
      <rect className="clock-digital-bg" x={cx - 54} y={cy + 22} width="108" height="24" rx="6" />
      <text className="clock-digital-time" x={cx} y={cy + 38}>
        {digitalTime}
      </text>
    </svg>
  );
}

function describePieSlice(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

function ClockHand({ cx, cy, angle, length, className }) {
  const end = polarToCartesian(cx, cy, length, angle);

  return <line className={className} x1={cx} y1={cy} x2={end.x} y2={end.y} />;
}

function polarToCartesian(cx, cy, radius, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}
