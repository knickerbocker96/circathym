export function scheduleAlarm(wakeDate, onFire) {
  const ms = wakeDate - new Date();
  if (ms <= 0) { onFire(); return () => {}; }
  const id = setTimeout(() => onFire(), ms);
  return () => clearTimeout(id);
}
