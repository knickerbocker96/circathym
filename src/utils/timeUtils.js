export function formatHHMM(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
