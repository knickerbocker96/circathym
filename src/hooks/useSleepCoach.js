import { useState } from 'react';

export default function useSleepCoach(personalCycleLength, sleepLog) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function ask(userMessage) {
    setLoading(true);
    setError(null);
    setResponse('');
    try {
      const result = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          personalCycleLength,
          sleepLog: sleepLog.slice(-7),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const data = await result.json();
      if (!result.ok) throw new Error(data?.error || 'Coach request failed');
      setResponse(data.response);
    } catch (e) {
      setError('AI coach is using offline fallback.');
      setResponse(getOfflineCoachReply(userMessage, personalCycleLength));
    } finally {
      setLoading(false);
    }
  }

  return { ask, response, loading, error };
}

function getOfflineCoachReply(message, personalCycleLength) {
  const cycle = personalCycleLength || 90;
  const text = message.toLowerCase();
  const examMatch = text.match(/(\d{1,2})\s*(am|pm)/);
  const wakeHour = examMatch ? Number(examMatch[1]) + (examMatch[2] === 'pm' && Number(examMatch[1]) !== 12 ? 12 : 0) : 8;
  const wake = new Date();
  wake.setDate(wake.getDate() + 1);
  wake.setHours(wakeHour, 0, 0, 0);
  const bedtime = new Date(wake.getTime() - (15 + cycle * 5) * 60000);
  return `Offline coach: aim for about 5 cycles using your ${cycle}-minute rhythm. Start winding down 30 minutes before bed. Recommended bedtime: ${bedtime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`;
}
