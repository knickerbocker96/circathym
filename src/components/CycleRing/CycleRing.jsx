import React from 'react';
import './CycleRing.css';
import { formatTime12, getTimeZoneParts } from '../../utils/timeUtils';

const REM_BY_CYCLE_MINUTES = [10, 15, 20, 25, 30];

export default function CycleRing({
  currentTime,
  wakeDate,
  showCycleBoundaries = true,
  showStageMarkers = true,
  showRedStages = true,
  showAmberStages = true,
  showGreenStages = true,
  cycleMinutes = 90,
  wakeClassification = null,
  size = 410,
}) {
  const cycle = cycleMinutes || 90;
  const parts = getTimeZoneParts(currentTime);
  const digitalTime = formatTime12(currentTime);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.44;
  const digitalWidth = digitalTime.length * 8.5 + 20;
  const hourAngle = ((parts.hour % 12) + parts.minute / 60) * 30;
  const minuteAngle = (parts.minute + parts.second / 60) * 6;
  const secondAngle = parts.second * 6;
  const currentClockAngle = ((parts.hour % 12) * 60 + parts.minute + parts.second / 60) * 0.5;
  const durationMinutes = wakeDate ? Math.max(0, (wakeDate - currentTime) / 60000) : 0;
  const sleepAngle = Math.min(durationMinutes * 0.5, 359.9);
  const sleepStartAngle = currentClockAngle;
  const sleepEndAngle = sleepStartAngle + sleepAngle;
  const wakeMarkerAngle = sleepEndAngle;
  const wakeMarkerOuter = polarToCartesian(cx, cy, radius + 7, wakeMarkerAngle);
  const wakeMarkerInner = polarToCartesian(cx, cy, radius - 50, wakeMarkerAngle);
  const wakeMarkerDot = polarToCartesian(cx, cy, radius - 18, wakeMarkerAngle);
  const wakeColor = getWakeColor(wakeClassification?.color);
  const dividerCount = Math.floor(durationMinutes / cycle);
  const remDividerCount = Math.ceil(durationMinutes / cycle);
  const disruptiveDividerCount = Math.ceil(durationMinutes / cycle);

  const ticks = Array.from({ length: 60 }, (_, index) => {
    const isHourTick = index % 5 === 0;
    const angle = index * 6;
    const outer = polarToCartesian(cx, cy, radius, angle);
    const inner = polarToCartesian(cx, cy, radius - (isHourTick ? 12 : 6), angle);

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
    const position = polarToCartesian(cx, cy, radius - 28, number * 30);

    return (
      <text key={number} className="clock-number" x={position.x} y={position.y}>
        {number}
      </text>
    );
  });

  const cycleDividers = Array.from({ length: dividerCount }, (_, index) => {
    const angle = sleepStartAngle + (index + 1) * cycle * 0.5;
    const inner = polarToCartesian(cx, cy, 20, angle);
    const outer = polarToCartesian(cx, cy, radius - 20, angle);

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
    const cycleStartMinute = index * cycle;
    const remDuration = REM_BY_CYCLE_MINUTES[Math.min(index, REM_BY_CYCLE_MINUTES.length - 1)];
    const remStartMinute = cycleStartMinute + cycle - remDuration;

    if (remStartMinute <= 0 || remStartMinute >= durationMinutes) return null;

    const angle = sleepStartAngle + remStartMinute * 0.5;
    const inner = polarToCartesian(cx, cy, 24, angle);
    const outer = polarToCartesian(cx, cy, radius - 22, angle);
    const rag = getRagColor(remDuration);

    if (!shouldShowRagStage(rag.name, { showRedStages, showAmberStages, showGreenStages })) return null;

    return (
      <line
        key={index}
        className="sleep-rem-divider"
        stroke={rag.color}
        x1={inner.x}
        y1={inner.y}
        x2={outer.x}
        y2={outer.y}
      />
    );
  });

  const disruptiveDividers = Array.from({ length: disruptiveDividerCount }, (_, index) => {
    const disruptiveMinute = index * cycle + Math.round(cycle / 2);

    if (disruptiveMinute >= durationMinutes) return null;
    if (!showRedStages) return null;

    const angle = sleepStartAngle + disruptiveMinute * 0.5;
    const inner = polarToCartesian(cx, cy, 28, angle);
    const outer = polarToCartesian(cx, cy, radius - 24, angle);

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
          d={describePieSlice(cx, cy, radius - 20, sleepStartAngle, sleepEndAngle)}
        />
      )}
      {showStageMarkers && disruptiveDividers}
      {showStageMarkers && remDividers}
      {showCycleBoundaries && cycleDividers}
      {wakeDate && sleepAngle > 0 && (
        <g className={`wake-marker wake-marker--${wakeClassification?.color || 'green'}`}>
          <line
            className="wake-marker__needle"
            stroke={wakeColor}
            x1={wakeMarkerInner.x}
            y1={wakeMarkerInner.y}
            x2={wakeMarkerOuter.x}
            y2={wakeMarkerOuter.y}
          />
          <circle
            className="wake-marker__dot"
            fill={wakeColor}
            cx={wakeMarkerDot.x}
            cy={wakeMarkerDot.y}
            r="7"
          />
          <circle
            className="wake-marker__halo"
            stroke={wakeColor}
            cx={wakeMarkerDot.x}
            cy={wakeMarkerDot.y}
            r="12"
          />
        </g>
      )}
      {ticks}
      {numbers}
      <ClockHand cx={cx} cy={cy} angle={hourAngle} length={radius * 0.5} className="clock-hand clock-hand--hour" />
      <ClockHand cx={cx} cy={cy} angle={minuteAngle} length={radius * 0.72} className="clock-hand clock-hand--minute" />
      <ClockHand cx={cx} cy={cy} angle={secondAngle} length={radius * 0.8} className="clock-hand clock-hand--second" />
      <circle className="clock-pin" cx={cx} cy={cy} r="4.5" />
      <rect className="clock-digital-bg" x={cx - digitalWidth / 2} y={cy + 20} width={digitalWidth} height={22} rx="6" />
      <text className="clock-digital-time" x={cx} y={cy + 34}>
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
  if (minutesFromCycleBoundary <= 15) return { name: 'green', color: '#34C759' };
  if (minutesFromCycleBoundary <= 60) return { name: 'amber', color: '#FF9500' };
  return { name: 'red', color: '#FF3B30' };
}

function shouldShowRagStage(name, filters) {
  if (name === 'red') return filters.showRedStages;
  if (name === 'amber') return filters.showAmberStages;
  if (name === 'green') return filters.showGreenStages;
  return false;
}

function getWakeColor(color) {
  if (color === 'red') return '#FF3B30';
  if (color === 'amber') return '#FF9500';
  return '#34C759';
}

function polarToCartesian(cx, cy, radius, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}
