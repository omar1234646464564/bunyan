type Bucket = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
};

// In-memory fixed-window counters. This is intentionally dependency-free and
// fits the single-process SQLite deployment model. Note: state is per-process,
// so on horizontally-scaled or serverless deployments each instance keeps its
// own counters. Swap this for a shared store (e.g. Redis/Upstash) if needed.
const buckets = new Map<string, Bucket>();

const MAX_KEYS = 10_000;

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();

  // Opportunistic cleanup so the map cannot grow unbounded.
  if (buckets.size >= MAX_KEYS) {
    for (const [k, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(k);
    }
  }

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  current.count += 1;
  if (current.count > limit) {
    return { ok: false, remaining: 0, retryAfterMs: current.resetAt - now };
  }

  return { ok: true, remaining: limit - current.count, retryAfterMs: 0 };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
