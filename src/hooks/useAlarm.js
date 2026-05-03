import { useRef, useEffect } from 'react';

function playBeep(audioContextRef, duration = 3000) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = audioContextRef.current || new AudioContext();
    const shouldCloseContext = !audioContextRef.current;

    audioContextRef.current = ctx;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      if (shouldCloseContext) ctx.close();
    }, duration);
  } catch (e) {
    const a = new Audio();
    a.play().catch(() => {});
  }
}

export default function useAlarm(onRing) {
  const cancelRef = useRef(null);
  const onRingRef = useRef(onRing);
  const audioContextRef = useRef(null);

  useEffect(() => () => {
    if (cancelRef.current) cancelRef.current();
    if (audioContextRef.current) audioContextRef.current.close();
  }, []);

  useEffect(() => {
    onRingRef.current = onRing;
  }, [onRing]);

  function triggerAlarm() {
    playBeep(audioContextRef);
    if (onRingRef.current) onRingRef.current();
  }

  function unlockAlarmSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    } catch (e) {}
  }

  function setAlarmAt(date) {
    unlockAlarmSound();
    if (cancelRef.current) cancelRef.current();
    cancelRef.current = null;
    const ms = date - new Date();
    if (ms <= 0) { triggerAlarm(); return; }
    const id = setTimeout(() => { triggerAlarm(); cancelRef.current = null; }, ms);
    cancelRef.current = () => clearTimeout(id);
  }

  function clearAlarm() { if (cancelRef.current) { cancelRef.current(); cancelRef.current = null; } }

  return { setAlarmAt, clearAlarm, unlockAlarmSound };
}
