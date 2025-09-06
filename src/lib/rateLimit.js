// Tiny in-memory rate limiter. Good enough for dev; swap for Upstash in prod.
export async function rateLimit(req, { limit = 60, windowMs = 60_000, key = 'global' } = {}) {
  const ip = req.headers.get('x-forwarded-for') || 'local';
  const id = `${key}:${ip}`;
  const now = Date.now();

  if (!global._rl) global._rl = {};
  const bucket = global._rl[id] || (global._rl[id] = { count: 0, reset: now + windowMs });

  if (now > bucket.reset) {
    bucket.count = 0;
    bucket.reset = now + windowMs;
  }

  bucket.count++;
  const allowed = bucket.count <= limit;
  const resetMs = bucket.reset - now;
  return { allowed, resetMs };
}
