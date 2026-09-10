interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Basic in-memory rate limiter to prevent PIN brute force attacks
 * @param key unique identifier (e.g. `pin:${slug}:${clientIp}`)
 * @param maxAttempts maximum allowed attempts within the window
 * @param windowMs window in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 10 * 60 * 1000 // 10 minutes
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetInSeconds: Math.ceil(windowMs / 1000) };
  }

  if (record.count >= maxAttempts) {
    const resetInSeconds = Math.max(0, Math.ceil((record.resetTime - now) / 1000));
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  record.count += 1;
  const resetInSeconds = Math.max(0, Math.ceil((record.resetTime - now) / 1000));
  return { allowed: true, remaining: maxAttempts - record.count, resetInSeconds };
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
