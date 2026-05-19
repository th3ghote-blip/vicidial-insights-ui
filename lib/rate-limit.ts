/**
 * Simple in-memory rate limiter.
 * Per-instance on Vercel (good enough for low-traffic endpoints).
 */
const store = new Map<string, { count: number; reset: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (now > v.reset) store.delete(k);
  }
}, 5 * 60 * 1000);

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
