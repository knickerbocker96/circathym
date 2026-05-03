interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

const buckets = new Map<string, Bucket>();

export function getClientKey(request: Request, route: string) {
  const forwarded = request.headers.get('x-forwarded-for') || '';
  const ip = forwarded.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'local';
  return `${route}:${ip}`;
}

export function rateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

export function rateLimitHeaders(result: ReturnType<typeof rateLimit>) {
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return {
    'x-ratelimit-remaining': String(result.remaining),
    'x-ratelimit-reset': String(result.resetAt),
    ...(result.allowed ? {} : { 'retry-after': String(retryAfter) }),
  };
}
