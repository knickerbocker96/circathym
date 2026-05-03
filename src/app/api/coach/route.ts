import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import {
  auditLog,
  hasMedicalEscalation,
  medicalEscalationResponse,
  parseJsonBody,
  sanitizeCoachMessage,
  sanitizeCycleLength,
  sanitizeSleepLog,
  withTimeout,
  type SleepEntry,
} from '@/lib/aiSafety';
import { getClientKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const maxDuration = 15;

export async function POST(request: Request) {
  const startedAt = Date.now();
  const limit = rateLimit({
    key: getClientKey(request, 'coach'),
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!limit.allowed) {
    auditLog({ route: 'coach', startedAt, rateLimited: true });
    return NextResponse.json(
      { error: 'Too many coach requests. Please wait a few minutes.' },
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  const parsed = await parseJsonBody(request);
  if (parsed.error) {
    auditLog({ route: 'coach', startedAt, error: parsed.error });
    return NextResponse.json({ error: parsed.error }, { status: 413, headers: rateLimitHeaders(limit) });
  }

  const body = parsed.body as Record<string, unknown>;
  const message = sanitizeCoachMessage(body.message);
  const personalCycleLength = sanitizeCycleLength(body.personalCycleLength);
  const sleepLog = sanitizeSleepLog(body.sleepLog);
  const timeZone = String(body.timeZone || 'local time');
  const summary = summarizeSleep(sleepLog, personalCycleLength);

  if (!message) {
    auditLog({ route: 'coach', startedAt, error: 'missing_message' });
    return NextResponse.json({ error: 'Missing message' }, { status: 400, headers: rateLimitHeaders(limit) });
  }

  if (hasMedicalEscalation(message)) {
    auditLog({ route: 'coach', startedAt, fallback: true, error: 'medical_escalation' });
    return NextResponse.json({
      response: medicalEscalationResponse(),
      fallback: true,
    }, { headers: rateLimitHeaders(limit) });
  }

  if (!process.env.OPENAI_API_KEY) {
    auditLog({ route: 'coach', startedAt, fallback: true, error: 'missing_api_key' });
    return NextResponse.json(
      { response: offlineCoach(message, personalCycleLength), fallback: true },
      { headers: rateLimitHeaders(limit) }
    );
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await withTimeout(client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 150,
      messages: [
        { role: 'system', content: buildSystemPrompt(personalCycleLength, sleepLog, timeZone, summary) },
        { role: 'user', content: message },
      ],
    }));

    auditLog({ route: 'coach', startedAt });
    return NextResponse.json({
      response: result.choices[0].message.content?.trim() || offlineCoach(message, personalCycleLength),
    }, { headers: rateLimitHeaders(limit) });
  } catch (error) {
    auditLog({ route: 'coach', startedAt, fallback: true, error: error instanceof Error ? error.message : 'ai_error' });
    return NextResponse.json(
      { response: offlineCoach(message, personalCycleLength), fallback: true },
      { headers: rateLimitHeaders(limit) }
    );
  }
}

function buildSystemPrompt(personalCycleLength: number | null, sleepLog: SleepEntry[], timeZone: string, summary: ReturnType<typeof summarizeSleep>) {
  const cycleInfo = personalCycleLength
    ? `The user's learned sleep cycle length is ${personalCycleLength} minutes.`
    : 'The user does not have enough data yet, so use the default 90-minute cycle.';

  const recent = sleepLog.length
    ? sleepLog.map((entry) => {
        const wake = new Date(entry.waketime);
        const bed = new Date(entry.bedtime);
        const hours = ((wake.getTime() - bed.getTime()) / 3600000).toFixed(1);
        return `${wake.toLocaleDateString()} slept ${hours}h, wake quality ${entry.rating}/5`;
      }).join('\n')
    : 'No sleep history logged yet.';

  return `You are Circathym's concise sleep coach.
${cycleInfo}
Timezone: ${timeZone}.
Confidence: ${summary.confidence}.
Sleep debt: ${summary.sleepDebt}.
Recent sleep history:
${recent}
Rules:
- Keep responses under 100 words.
- Only give sleep-related guidance.
- Ground advice in the user's logs when available.
- Always end with one concrete bedtime or wake time recommendation.
- This is wellness guidance, not medical advice.`;
}

function offlineCoach(message: string, personalCycleLength: number | null) {
  const cycle = personalCycleLength || 90;
  const lower = message.toLowerCase();
  const hourMatch = lower.match(/(\d{1,2})\s*(am|pm)/);
  let wakeHour = 8;
  if (hourMatch) {
    wakeHour = Number(hourMatch[1]);
    if (hourMatch[2] === 'pm' && wakeHour !== 12) wakeHour += 12;
    if (hourMatch[2] === 'am' && wakeHour === 12) wakeHour = 0;
  }

  const wake = new Date();
  wake.setDate(wake.getDate() + 1);
  wake.setHours(wakeHour, 0, 0, 0);
  const bedtime = new Date(wake.getTime() - (15 + cycle * 5) * 60000);

  return `Use your ${cycle}-minute rhythm and protect five full cycles. Start winding down 30 minutes earlier and avoid snoozing past the next boundary. Recommended bedtime: ${bedtime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`;
}

function summarizeSleep(sleepLog: SleepEntry[], personalCycleLength: number | null) {
  const good = sleepLog.filter(entry => entry.rating >= 4).length;
  const confidence = personalCycleLength && good >= 6 ? 'High' : personalCycleLength && good >= 3 ? 'Medium' : 'Low';
  const durations = sleepLog
    .map(entry => (new Date(entry.waketime).getTime() - new Date(entry.bedtime).getTime()) / 3600000)
    .filter(hours => hours > 1 && hours < 12);
  if (!durations.length) return { confidence, sleepDebt: 'unknown' };
  const avg = durations.reduce((sum, hours) => sum + hours, 0) / durations.length;
  const debt = Math.max(0, (8 - avg) * durations.length);
  const label = debt < 2 ? 'recovered' : debt < 6 ? `${debt.toFixed(1)}h mild debt` : `${debt.toFixed(1)}h high debt`;
  return { confidence, sleepDebt: label };
}
