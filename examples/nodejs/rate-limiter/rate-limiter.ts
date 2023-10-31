import { Metrics } from "./metrics";

export interface RateLimiter {
  acquire(id: string): Promise<boolean>;
  getMetrics(): Metrics;
}

export abstract class AbstractRateLimiter implements RateLimiter {

  metrics: Metrics = new Metrics();

  abstract acquire(id: string): Promise<boolean>;

  generateMinuteKey(baseKey: string): string {
    const currentDate = new Date();
    const currentMinute = currentDate.getMinutes();
    return `${baseKey}_${currentMinute}`;
  }

  public getMetrics(): Metrics {
    return this.metrics;
  }
}

