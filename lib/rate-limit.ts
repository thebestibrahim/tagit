import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Upstash Redis rate limiter (production) ──────────────────────────────────
// Falls back to in-memory when UPSTASH env vars are absent (local dev).
// In-memory does NOT share state across serverless instances — set Upstash
// vars in production to get reliable cross-instance limiting.

type Entry = { count: number; reset: number };
const memoryStore = new Map<string, Entry>();

function memoryRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry || now > entry.reset) {
    memoryStore.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// Vercel's Upstash integration injects KV_REST_API_*; a standalone Upstash
// project uses UPSTASH_REDIS_REST_*. Accept either so the limiter activates
// regardless of how Redis was provisioned.
const upstashUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = upstashUrl && upstashToken
  ? new Redis({ url: upstashUrl, token: upstashToken })
  : null;

const limiters = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;
  const key = `${limit}:${windowMs}`;
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs}ms`),
        analytics: false,
      })
    );
  }
  return limiters.get(key)!;
}

export async function rateLimitAsync(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const limiter = getUpstashLimiter(limit, windowMs);
  if (limiter) {
    const { success } = await limiter.limit(key);
    return success;
  }
  return memoryRateLimit(key, limit, windowMs);
}

// Synchronous fallback kept for routes that haven't migrated yet
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  return memoryRateLimit(key, limit, windowMs);
}

export function getIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
