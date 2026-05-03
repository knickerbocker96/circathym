import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import {
  auditLog,
  parseJsonBody,
  sanitizeCycleLength,
  sanitizeSleepLog,
  withTimeout,
  type SleepEntry,
} from '@/lib/aiSafety';
import { getClientKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const startedAt = Date.now();
  const limit = rateLimit({
    key: getClientKey(request, 'insight'),
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (!limit.allowed) {
    auditLog({ route: 'insight', startedAt, rateLimited: true });
    return NextResponse.json(
      { error: 'Too many insight requests. Please wait a few minutes.' },
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  const parsed = await parseJsonBody(request);
  if (parsed.error) {
    auditLog({ route: 'insight', startedAt, error: parsed.error });
    return NextResponse.json({ error: parsed.error }, { status: 413, headers: rateLimitHeaders(limit) });
  }

  const body = parsed.body as Record<string, unknown>;
  const personalCycleLength = sanitizeCycleLength(body.personalCycleLength);
  const sleepLog = sanitizeSleepLog(body.sleepLog);

  if (!sleepLog.length) {
    auditLog({ route: 'insight', startedAt, fallback: true, error: 'empty_log' });
    return NextResponse.json(
      { insight: 'Log a few mornings to unlock a personalized sleep pattern.', fallback: true },
      { headers: rateLimitHeaders(limit) }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    auditLog({ route: 'insight', startedAt, fallback: true, error: 'missing_api_key' });
    return NextResponse.json(
      { insight: localInsight(personalCycleLength, sleepLog), fallback: true },
      { headers: rateLimitHeaders(limit) }
    );
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const avg = (sleepLog.reduce((sum, entry) => sum + entry.rating, 0) / sleepLog.length).toFixed(1);
    const result = await withTimeout(client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 60,
      messages: [
        { role: 'system', content: 'Give one specific sleep insight sentence under 22 words. No pleasantries. Not medical advice.' },
        { role: 'user', content: `Cycle: ${personalCycleLength || 90} minutes. Average wake quality: ${avg}/5 over ${sleepLog.length} recent nights.` },
      ],
    }));

    auditLog({ route: 'insight', startedAt });
    return NextResponse.json({
      insight: result.choices[0].message.content?.trim() || localInsight(personalCycleLength, sleepLog),
    }, { headers: rateLimitHeaders(limit) });
  } catch (error) {
    auditLog({ route: 'insight', startedAt, fallback: true, error: error instanceof Error ? error.message : 'ai_error' });
    return NextResponse.json(
      { insight: localInsight(personalCycleLength, sleepLog), fallback: true },
      { headers: rateLimitHeaders(limit) }
    );
  }
}

function localInsight(personalCycleLength: number | null, sleepLog: SleepEntry[]) {
  const cycle = personalCycleLength || 90;
  const avg = sleepLog.reduce((sum, entry) => sum + entry.rating, 0) / sleepLog.length;
  if (avg >= 4) return `Your best wakes cluster near ${cycle}-minute boundaries; keep tomorrow's alarm within 15 minutes of one.`;
  if (avg <= 2.8) return `Your recent wake quality is low; protect five full ${cycle}-minute cycles tonight.`;
  return `Your pattern is forming; one more high-quality wake will sharpen the ${cycle}-minute estimate.`;
}
