import React from 'react';
import './CycleRing.css';
import { formatTime12, getTimeZoneParts } from '../../utils/timeUtils';

const CYCLE_MINUTES = 90;
const DISRUPTIVE_MARK_MINUTES = 45;
const REM_BY_CYCLE_MINUTES = [10, 15, 20, 25, 30];

export default function CycleRing({
  currentTime,
  wakeDate,
  showCycleBoundaries = true,
  showStageMarkers = true,
  size = 410,
}) {
  const parts = getTimeZoneParts(currentTime);
  const digitalTime = formatTime12(currentTime);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.44;
  const digitalWidth = digitalTime.length * 9 + 18;
  const hourAngle = ((parts.hour % 12) + parts.minute / 60) * 30;
  const minuteAngle = (parts.minute + parts.second / 60) * 6;
  const secondAngle = parts.second * 6;
  const currentClockAngle = ((parts.hour % 12) * 60 + parts.minute + parts.second / 60) * 0.5;
  const durationMinutes = wakeDate ? Math.max(0, (wakeDate - currentTime) / 60000) : 0;
  const sleepAngle = Math.min(durationMinutes * 0.5, 359.9);
  const sleepStartAngle = currentClockAngle;
  const sleepEndAngle = sleepStartAngle + sleepAngle;
  const dividerCount = Math.floor(durationMinutes / CYCLE_MINUTES);
  const remDividerCount = Math.ceil(durationMinutes / CYCLE_MINUTES);
  const disruptiveDividerCount = Math.ceil(durationMinutes / CYCLE_MINUTES);

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
  const numbers = Array.from({ length: 12 }, (_, index) => {
    const number = index + 1;
    const position = polarToCartesian(cx, cy, radius - 30, number * 30);

    return (
      <text key={number} className="clock-number" x={position.x} y={position.y}>
        {number}
      </text>
    );
  });
  const cycleDividers = Array.from({ length: dividerCount }, (_, index) => {
    const angle = sleepStartAngle + (index + 1) * CYCLE_MINUTES * 0.5;
    const inner = polarToCartesian(cx, cy, 20, angle);
    const outer = polarToCartesian(cx, cy, radius - 22, angle);

    return (
      <line
        key={index}
        className="sleep-cycle-divider"
        x1={inner.x}
        y1={inner.y}
        x2={outer.x}
        y2={outer.y}
      />
    );
  });
  const remDividers = Array.from({ length: remDividerCount }, (_, index) => {
    const cycleStartMinute = index * CYCLE_MINUTES;
    const remDuration = REM_BY_CYCLE_MINUTES[Math.min(index, REM_BY_CYCLE_MINUTES.length - 1)];
    const remStartMinute = cycleStartMinute + CYCLE_MINUTES - remDuration;

    if (remStartMinute <= 0 || remStartMinute >= durationMinutes) {
      return null;
    }

    const angle = sleepStartAngle + remStartMinute * 0.5;
    const inner = polarToCartesian(cx, cy, 24, angle);
    const outer = polarToCartesian(cx, cy, radius - 24, angle);
    const color = getRagColor(remDuration);

    return (
      <line
        key={index}
        className="sleep-rem-divider"
        stroke={color}
        x1={inner.x}
        y1={inner.y}
        x2={outer.x}
        y2={outer.y}
      />
    );
  });
  const disruptiveDividers = Array.from({ length: disruptiveDividerCount }, (_, index) => {
    const disruptiveMinute = index * CYCLE_MINUTES + DISRUPTIVE_MARK_MINUTES;

    if (disruptiveMinute >= durationMinutes) {
      return null;
    }

    const angle = sleepStartAngle + disruptiveMinute * 0.5;
    const inner = polarToCartesian(cx, cy, 28, angle);
    const outer = polarToCartesian(cx, cy, radius - 26, angle);

    return (
      <line
        key={index}
        className="sleep-disruptive-divider"
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
      {showStageMarkers && disruptiveDividers}
      {showStageMarkers && remDividers}
      {showCycleBoundaries && cycleDividers}
      {ticks}
      {numbers}
      <ClockHand cx={cx} cy={cy} angle={hourAngle} length={radius * 0.5} className="clock-hand clock-hand--hour" />
      <ClockHand cx={cx} cy={cy} angle={minuteAngle} length={radius * 0.72} className="clock-hand clock-hand--minute" />
      <ClockHand cx={cx} cy={cy} angle={secondAngle} length={radius * 0.78} className="clock-hand clock-hand--second" />
      <circle className="clock-pin" cx={cx} cy={cy} r="5" />
      <rect className="clock-digital-bg" x={cx - digitalWidth / 2} y={cy + 22} width={digitalWidth} height="24" rx="6" />
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

function getRagColor(minutesFromCycleBoundary) {
  if (minutesFromCycleBoundary <= 15) return '#22c55e';
  if (minutesFromCycleBoundary <= 60) return '#f59e0b';
  return '#ef4444';
}

function polarToCartesian(cx, cy, radius, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}
