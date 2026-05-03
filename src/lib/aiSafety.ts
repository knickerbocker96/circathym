export interface SleepEntry {
  bedtime: string;
  waketime: string;
  rating: number;
}

export const AI_TIMEOUT_MS = 8000;
export const MAX_COACH_MESSAGE_CHARS = 500;
export const MAX_SLEEP_LOG_ENTRIES = 7;

const MEDICAL_ESCALATION_PATTERNS = [
  /suicid|self[- ]?harm|kill myself/i,
  /can't breathe|chest pain|fainting|seizure/i,
  /falling asleep while driving/i,
];

export function parseJsonBody(request: Request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 12_000) {
    return Promise.resolve({ error: 'Payload too large' as const, body: null });
  }

  return request.json()
    .then((body) => ({ error: null, body }))
    .catch(() => ({ error: null, body: {} }));
}

export function sanitizeCoachMessage(value: unknown) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_COACH_MESSAGE_CHARS);
}

export function sanitizeCycleLength(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value < 70 || value > 125) return null;
  return Math.round(value);
}

export function sanitizeSleepLog(value: unknown): SleepEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(-MAX_SLEEP_LOG_ENTRIES)
    .map((entry) => ({
      bedtime: String(entry?.bedtime || ''),
      waketime: String(entry?.waketime || ''),
      rating: Number(entry?.rating),
    }))
    .filter((entry) => {
      const bed = new Date(entry.bedtime).getTime();
      const wake = new Date(entry.waketime).getTime();
      return Number.isFinite(bed)
        && Number.isFinite(wake)
        && wake > bed
        && entry.rating >= 1
        && entry.rating <= 5;
    });
}

export function hasMedicalEscalation(message: string) {
  return MEDICAL_ESCALATION_PATTERNS.some((pattern) => pattern.test(message));
}

export function medicalEscalationResponse() {
  return 'This sounds potentially serious, so Circathym should not coach through it. Please contact local emergency services or a medical professional now. For tonight, do not drive while drowsy; choose the safest immediate help option.';
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs = AI_TIMEOUT_MS): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error('AI_TIMEOUT')), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export function auditLog(event: {
  route: string;
  startedAt: number;
  fallback?: boolean;
  error?: string;
  rateLimited?: boolean;
}) {
  const line = {
    route: event.route,
    latencyMs: Date.now() - event.startedAt,
    fallback: Boolean(event.fallback),
    rateLimited: Boolean(event.rateLimited),
    error: event.error || null,
  };

  console.info('[circathym-ai-audit]', JSON.stringify(line));
}
