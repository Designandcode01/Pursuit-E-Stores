type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Minimal fixed-window limiter for local/dev and low-traffic deployments.
 *
 * IMPORTANT: serverless instances do not share memory. For production traffic
 * replace this with Upstash Ratelimit (or Cloudflare rate limiting):
 *
 *   const { success } = await ratelimit.limit(key);
 *
 * Keep the same function signature so call sites do not change.
 */
export function rateLimit(key: string, maxRequests: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: maxRequests - 1 };
  }

  if (bucket.count >= maxRequests) {
    return { ok: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { ok: true, remaining: maxRequests - bucket.count };
}

// Prevent unbounded growth in long-running Node processes.
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, 10 * 60 * 1000);
  timer.unref?.();
}
