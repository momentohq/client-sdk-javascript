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

    let allowed = false;

    const currentMinuteKey = this.generateMinuteKey(id);
    // we do not pass a TTL to this; we don't know if the key for this user was present or not
    const resp = await this._client.increment('rate-limiter', currentMinuteKey);

    if (resp instanceof CacheIncrement.Success) {
      if (resp.value() <= this._limit) {
        if (resp.value() === 1) {
          await this._client.updateTtl('rate-limiter', id, 60000);
        }
        allowed = true;
      }
    } else if (resp instanceof CacheIncrement.Error) {
      console.error('Error while incrementing ' + resp.message());
      this.metrics.recordErrors();
    }

    const latency = Date.now() - start;
    if (allowed) {
      this.metrics.recordSuccess(latency);
    } else {
      this.metrics.recordThrottle(latency);
    }

    return allowed;
  }
}
