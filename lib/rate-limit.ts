import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory token bucket fallback. Fine for a single dev/CI process; NOT
// safe for a multi-instance production deployment (each instance has its
// own bucket) — this is why the Upstash path below exists. Kept
// dependency-free at the fallback layer so local dev needs no extra
// service, matching the "testable without credentials" rule.
const buckets = new Map<string, { count: number; resetAt: number }>();

function inMemoryRateLimit(key: string, limit: number, windowMs: number): boolean {
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

// Ratelimit instances are cheap to construct but Upstash's own guidance is
// to reuse them per (limit, window) pair rather than build one per request.
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const cacheKey = `${limit}:${windowMs}`;
  const cached = upstashLimiters.get(cacheKey);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    prefix: "chelena",
  });
  upstashLimiters.set(cacheKey, limiter);
  return limiter;
}

// Async because the real (Upstash) path is a network call — this repo's
// .env.local has no Upstash credentials, so every request in this
// environment exercises the in-memory fallback; the Upstash path is
// written and ready to activate the moment those env vars are set (see
// docs/LAUNCH-CHECKLIST.md), but is untestable without a real Upstash
// instance, same situation as WhatsApp/Resend behind MOCK_PROVIDERS.
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const limiter = getUpstashLimiter(limit, windowMs);
  if (limiter) {
    const { success } = await limiter.limit(key);
    return success;
  }
  return inMemoryRateLimit(key, limit, windowMs);
}
