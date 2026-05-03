import { useRef, useEffect } from 'react';

const TONES = {
  gentle: { wave: 'sine', frequency: 528, gain: 0.045, duration: 5000 },
  classic: { wave: 'triangle', frequency: 880, gain: 0.055, duration: 4500 },
  focus: { wave: 'square', frequency: 660, gain: 0.04, duration: 4500 },
  emergency: { wave: 'sawtooth', frequency: 1046, gain: 0.065, duration: 6000 },
};

function playTone(audioContextRef, activeNodesRef, settings = {}) {
  try {
    stopTone(activeNodesRef);
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = audioContextRef.current || new AudioContext();
    const tone = TONES[settings.tone] || TONES.gentle;
    const volume = typeof settings.volume === 'number' ? settings.volume : 0.6;
    const fadeIn = settings.fadeIn !== false;

    audioContextRef.current = ctx;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const stopAt = Date.now() + tone.duration;
    const timeouts = [];

    function pulse(delay, frequencyMultiplier = 1) {
      const id = setTimeout(() => {
        if (Date.now() > stopAt) return;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = tone.wave;
        oscillator.frequency.value = tone.frequency * frequencyMultiplier;
        gain.gain.setValueAtTime(fadeIn ? 0.001 : tone.gain * volume, ctx.currentTime);
        if (fadeIn) {
          gain.gain.exponentialRampToValueAtTime(Math.max(0.001, tone.gain * volume), ctx.currentTime + 0.7);
        }
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 1.25);
        activeNodesRef.current.nodes.push(oscillator);
      }, delay);
      timeouts.push(id);
    }

    const spacing = settings.tone === 'emergency' ? 700 : 1100;
    for (let delay = 0; delay < tone.duration; delay += spacing) {
      pulse(delay, delay % (spacing * 2) === 0 ? 1 : 1.25);
    }
    activeNodesRef.current.timeouts = timeouts;
  } catch (e) {
    const a = new Audio();
    a.play().catch(() => {});
  }
}

function stopTone(activeNodesRef) {
  activeNodesRef.current.timeouts.forEach((id) => clearTimeout(id));
  activeNodesRef.current.nodes.forEach((node) => {
    try { node.stop(); } catch (e) {}
  });
  activeNodesRef.current = { nodes: [], timeouts: [] };
}

export default function useAlarm(onRing) {
  const cancelRef = useRef(null);
  const onRingRef = useRef(onRing);
  const audioContextRef = useRef(null);
  const activeNodesRef = useRef({ nodes: [], timeouts: [] });

  useEffect(() => () => {
    if (cancelRef.current) cancelRef.current();
    stopTone(activeNodesRef);
    if (audioContextRef.current) audioContextRef.current.close();
  }, []);

  useEffect(() => {
    onRingRef.current = onRing;
  }, [onRing]);

  function triggerAlarm(settings) {
    playTone(audioContextRef, activeNodesRef, settings);
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

  function setAlarmAt(date, settings) {
    unlockAlarmSound();
    if (cancelRef.current) cancelRef.current();
    cancelRef.current = null;
    const ms = date - new Date();
    if (ms <= 0) { triggerAlarm(settings); return; }
    const id = setTimeout(() => { triggerAlarm(settings); cancelRef.current = null; }, ms);
    cancelRef.current = () => clearTimeout(id);
  }

  function clearAlarm() { if (cancelRef.current) { cancelRef.current(); cancelRef.current = null; } }

  function testAlarm(settings) {
    unlockAlarmSound();
    triggerAlarm(settings);
  }

  function stopAlarmSound() {
    stopTone(activeNodesRef);
  }

  return { setAlarmAt, clearAlarm, unlockAlarmSound, testAlarm, stopAlarmSound };
}
