import {CacheClient, CacheIncrement} from "@gomomento/sdk";
import {AbstractRateLimiter} from "./rate-limiter";

export class IncrementRateLimiter extends AbstractRateLimiter {
  _client: CacheClient;
  _limit: number;
  constructor(client: CacheClient, limit: number) {
    super();
    this._client = client;
    this._limit = limit;
  }

  public async acquire(id: string): Promise<boolean> {
    const start = Date.now();

    const currentMinuteKey = this.generateMinuteKey(id);
    // we do not pass a TTL to this; we don't know if the key for this user was present or not
    const resp = await this._client.increment('rate-limiter', currentMinuteKey);
    const latency = Date.now() - start;
    console.log(`Individual latency is ${latency}`);
    if (resp instanceof CacheIncrement.Success) {
      if (resp.value() <= this._limit) {
        if (resp.value() === 1) {
          await this._client.updateTtl('rate-limiter', id, 60000);
        }
        this.metrics.recordSuccess(latency);
        return true;
      }
      this.metrics.recordThrottle(latency);
      return false;
    } else if (resp instanceof CacheIncrement.Error) {
      console.error('Error while incrementing ' + resp.message());
      this.metrics.recordErrors();
      return false;
    }

    throw new Error(`unexpected rate limiter state`);
  }
}
