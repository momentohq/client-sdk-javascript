import {CacheClient, CacheGet} from "@gomomento/sdk";
import {AbstractRateLimiter} from "./rate-limiter";

export class GetIncrementRateLimiter extends AbstractRateLimiter {
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
    const getResp = await this._client.get('rate-limiter', currentMinuteKey);
    const latency = Date.now() - start;

    if (getResp instanceof CacheGet.Hit) {
      if (parseInt(getResp.value(), 10) < this._limit) {
        await this._client.increment('rate-limiter', currentMinuteKey);
        this.metrics.recordSuccess(latency);
        return true;
      }
      console.log(`Throttled user key ${currentMinuteKey}`);
      this.metrics.recordThrottle(latency);
      return false;
    } else if (getResp instanceof CacheGet.Miss) {
      // first call to key so we set TTL now to 60 seconds
      await this._client.increment('rate-limiter', currentMinuteKey, 1, {ttl: 60000});
      this.metrics.recordSuccess(latency);
      return true;
    } else if (getResp instanceof CacheGet.Error) {
      console.error(`Error while getting value for key ${currentMinuteKey}` + getResp.message());
      this.metrics.recordErrors();
    }

    throw new Error(`unexpected rate limiter state`);
  }
}
