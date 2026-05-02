import { useRef, useEffect } from 'react';

function playBeep(duration = 3000) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, duration);
  } catch (e) {
    const a = new Audio();
    a.play().catch(() => {});
  }
}

export default function useAlarm() {
  const cancelRef = useRef(null);

  useEffect(() => () => { if (cancelRef.current) cancelRef.current(); }, []);

  function setAlarmAt(date) {
    if (cancelRef.current) cancelRef.current();
    const ms = date - new Date();
    if (ms <= 0) { playBeep(); return; }
    const id = setTimeout(() => { playBeep(); cancelRef.current = null; }, ms);
    cancelRef.current = () => clearTimeout(id);
  }

  function clearAlarm() { if (cancelRef.current) { cancelRef.current(); cancelRef.current = null; } }

  return { setAlarmAt, clearAlarm };
}
