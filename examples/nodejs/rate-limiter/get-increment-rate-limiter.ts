import { CacheClient, CacheGet } from "@gomomento/sdk";
import {
  AbstractRateLimiter,
  RATE_LIMITER_CACHE_NAME,
  RATE_LIMITER_TTL_MILLIS,
} from "./rate-limiter";

export class GetIncrementRateLimiter extends AbstractRateLimiter {
  _client: CacheClient;
  _limit: number;

  constructor(client: CacheClient, limit: number) {
    super();
    this._client = client;
    this._limit = limit;
  }

  public async acquire(id: string): Promise<boolean> {
    const currentMinuteKey = this.generateMinuteKey(id);
    // we do not pass a TTL to this; we don't know if the key for this user was present or not
    const getResp = await this._client.get(
      RATE_LIMITER_CACHE_NAME,
      currentMinuteKey
    );

    if (getResp instanceof CacheGet.Hit) {
      if (parseInt(getResp.value(), 10) <= this._limit) {
        await this._client.increment(RATE_LIMITER_CACHE_NAME, currentMinuteKey);
        return true;
      }
    } else if (getResp instanceof CacheGet.Miss) {
      // first call to key, so we set TTL now to 60 seconds
      await this._client.increment(
        RATE_LIMITER_CACHE_NAME,
        currentMinuteKey,
        1,
        {
          ttl: RATE_LIMITER_TTL_MILLIS,
        }
      );
      return true;
    } else if (getResp instanceof CacheGet.Error) {
      throw new Error(getResp.message());
    }

    return false;
  }
}
