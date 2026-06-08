import type { Context, Next } from 'hono';

const TRUST_PROXY = process.env.TRUST_PROXY === 'true';

export function createRateLimiter(windowMs: number, max: number) {
  const store = new Map<string, { count: number; resetAt: number }>();

  // Purge expired entries every window to prevent unbounded growth
  const purgeInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key);
    }
  }, windowMs);
  purgeInterval.unref?.();

  return async (c: Context, next: Next): Promise<Response | void> => {
    // Only trust forwarded headers when behind a known proxy (set TRUST_PROXY=true in production)
    // Without proxy trust, header-based IP is user-controllable — fall back to 'unknown'
    const ip = TRUST_PROXY
      ? (c.req.header('x-forwarded-for')?.split(',')[0].trim() ?? c.req.header('x-real-ip') ?? 'unknown')
      : 'unknown';

    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now >= entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count++;
      if (entry.count > max) {
        c.header('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
        return c.json({ error: 'Too many requests' }, 429);
      }
    }

    await next();
  };
}
