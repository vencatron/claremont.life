/**
 * Minimal in-process rate limiter keyed by (bucket, ip).
 *
 * Limits per-instance — on serverless (Vercel) each cold-started function has
 * its own Map, so a determined attacker hitting many instances can exceed the
 * limit. It still meaningfully raises the bar for casual abuse. Swap for an
 * Upstash/Redis-backed limiter for distributed enforcement.
 */

type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Map<string, Entry>>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  bucket: string,
  ip: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  let map = buckets.get(bucket);
  if (!map) {
    map = new Map();
    buckets.set(bucket, map);
  }

  // Opportunistic cleanup of expired entries in this bucket.
  if (map.size > 250) {
    for (const [k, v] of map) if (v.resetAt <= now) map.delete(k);
  }

  let entry = map.get(ip);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    map.set(ip, entry);
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  return {
    ok: entry.count <= limit,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Extract the client IP from X-Forwarded-For. Vercel guarantees this header
 * is present and places the real client IP as the leftmost entry, rewriting
 * any caller-supplied value. Returns null if XFF is absent — callers should
 * treat that as an untrusted request (direct hits bypassing the proxy) and
 * reject or heavily throttle.
 *
 * We intentionally do NOT fall back to X-Real-IP or other caller-controlled
 * headers, which attackers could forge to rotate rate-limit buckets.
 */
export function getClientIp(req: Request): string | null {
  const xff = req.headers.get('x-forwarded-for');
  if (!xff) return null;
  const first = xff.split(',')[0]?.trim();
  return first || null;
}
