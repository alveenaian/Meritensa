// Simple in-memory rate limiter (for MVP; use Redis in production)

const rateLimits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const record = rateLimits.get(key);

  // Lazy cleanup: if this record is expired, delete it
  if (record && record.resetAt < now) {
    rateLimits.delete(key);
  }

  // Get fresh record after potential cleanup
  const currentRecord = rateLimits.get(key);

  if (!currentRecord) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (currentRecord.count >= limit) {
    return false;
  }

  currentRecord.count++;
  return true;
}
