// In-memory token bucket. Fine for a single dev/CI process; NOT safe for a
// multi-instance production deployment (each instance has its own bucket) —
// set UPSTASH_REDIS_REST_URL/TOKEN before launch to swap this for a real
// shared limiter (see docs/DECISIONS.md "Rate limiting"). Kept dependency-free
// so local dev needs no extra service, matching the "testable without
// credentials" rule.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
