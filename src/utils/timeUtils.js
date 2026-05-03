export const APP_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function formatHHMM(date, timeZone = APP_TIME_ZONE) {
  const parts = getTimeZoneParts(date, timeZone);
  const hours = String(parts.hour).padStart(2, '0');
  const minutes = String(parts.minute).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatHHMMSS(date, timeZone = APP_TIME_ZONE) {
  const parts = getTimeZoneParts(date, timeZone);
  const hours = String(parts.hour).padStart(2, '0');
  const minutes = String(parts.minute).padStart(2, '0');
  const seconds = String(parts.second).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function formatTime12(date, timeZone = APP_TIME_ZONE, includeSeconds = false) {
  const parts = getTimeZoneParts(date, timeZone);
  const period = parts.hour >= 12 ? 'PM' : 'AM';
  const hour12 = parts.hour % 12 || 12;
  const minutes = String(parts.minute).padStart(2, '0');

  if (!includeSeconds) {
    return `${hour12}:${minutes} ${period}`;
  }

  const seconds = String(parts.second).padStart(2, '0');
  return `${hour12}:${minutes}:${seconds} ${period}`;
}

export function getNextTimeInTimeZone(timeString, now = new Date(), timeZone = APP_TIME_ZONE) {
  const [hour, minute] = timeString.split(':').map(Number);
  const today = getTimeZoneParts(now, timeZone);

  let candidate = makeDateInTimeZone(
    { year: today.year, month: today.month, day: today.day, hour, minute },
    timeZone
  );

  if (candidate <= now) {
    const tomorrow = addDaysInTimeZone(today, 1);
    candidate = makeDateInTimeZone(
      { year: tomorrow.year, month: tomorrow.month, day: tomorrow.day, hour, minute },
      timeZone
    );
  }

  return candidate;
}

export function getTimeZoneParts(date, timeZone = APP_TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const values = {};
  formatter.formatToParts(date).forEach((part) => {
    if (part.type !== 'literal') {
      values[part.type] = Number(part.value);
    }
  });

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function makeDateInTimeZone(parts, timeZone) {
  const utcGuess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0);
  const firstOffset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  const firstResult = new Date(utcGuess - firstOffset);
  const finalOffset = getTimeZoneOffsetMs(firstResult, timeZone);

  return new Date(utcGuess - finalOffset);
}

function getTimeZoneOffsetMs(date, timeZone) {
  const parts = getTimeZoneParts(date, timeZone);
  const zonedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    0
  );

  return zonedAsUtc - date.getTime();
}

function addDaysInTimeZone(parts, days) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, 12, 0, 0, 0));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}
