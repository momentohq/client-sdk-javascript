export interface RateLimiter {
  isLimitExceeded(id: string): Promise<boolean>;
}

// since our rate limiting buckets are per minute, we expire keys every minute
export const RATE_LIMITER_TTL_MILLIS = 60000;

export abstract class AbstractRateLimiter implements RateLimiter {
  abstract isLimitExceeded(id: string): Promise<boolean>;

  /**
   * Generates a unique key for a user (baseKey) for the current minute. This key will server as the backend
   * cache key where we will store the amount of calls that have been made by a user for a given minute.
   * @param baseKey
   */
  generateMinuteKey(baseKey: string): string {
    const currentDate = new Date();
    const currentMinute = currentDate.getMinutes();
    return `${baseKey}_${currentMinute}`;
  }
}
