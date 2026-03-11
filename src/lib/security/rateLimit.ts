type Entry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Entry>();

function now() {
  return Date.now();
}

function gc() {
  const t = now();
  buckets.forEach((entry, k) => {
    if (entry.resetAt <= t) buckets.delete(k);
  });
}

/**
 * Simple in-memory fixed-window rate limit.
 * Suitable for low-cost hardening; for distributed production use Upstash/Redis.
 */
export function consumeRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number; remaining: number } {
  gc();
  const t = now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= t) {
    buckets.set(key, { count: 1, resetAt: t + windowMs });
    return {
      allowed: true,
      retryAfterSec: Math.ceil(windowMs / 1000),
      remaining: Math.max(0, maxRequests - 1),
    };
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - t) / 1000)),
      remaining: 0,
    };
  }

  current.count += 1;
  buckets.set(key, current);
  return {
    allowed: true,
    retryAfterSec: Math.max(1, Math.ceil((current.resetAt - t) / 1000)),
    remaining: Math.max(0, maxRequests - current.count),
  };
}

export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers.get("x-real-ip")?.trim();
  return forwarded || realIp || "unknown";
}
