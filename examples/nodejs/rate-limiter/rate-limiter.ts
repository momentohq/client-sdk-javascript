export interface RateLimiter {
  acquire(id: string): Promise<boolean>;
}

// since our rate limiting buckets are per minute, we expire keys every minute
export const RATE_LIMITER_TTL_MILLIS = 60000;

export abstract class AbstractRateLimiter implements RateLimiter {

  abstract acquire(id: string): Promise<boolean>;

  generateMinuteKey(baseKey: string): string {
    const currentDate = new Date();
    const currentMinute = currentDate.getMinutes();
    return `${baseKey}_${currentMinute}`;
  }
}

