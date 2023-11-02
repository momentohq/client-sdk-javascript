import { CacheClient, CacheIncrement, CacheUpdateTtl } from "@gomomento/sdk";
import {
  AbstractRateLimiter,
  RATE_LIMITER_CACHE_NAME,
  RATE_LIMITER_TTL_MILLIS,
} from "./rate-limiter";

export class MomentoRateLimiter extends AbstractRateLimiter {
  _client: CacheClient;
  _limit: number;

  constructor(client: CacheClient, limit: number) {
    super();
    this._client = client;
    this._limit = limit;
  }

  public async isLimitExceeded(id: string): Promise<boolean> {
    const currentMinuteKey = this.generateMinuteKey(id);
    // we do not pass a TTL to this; we don't know if the key for this user was present or not
    const resp = await this._client.increment(
      RATE_LIMITER_CACHE_NAME,
      currentMinuteKey
    );

    if (resp instanceof CacheIncrement.Success) {
      if (resp.value() <= this._limit) {
        // if returned value is 1, we know this was the first request in this minute for the given user. So
        // we set the TTL for this minute's key to 60 seconds now.
        if (resp.value() === 1) {
          const updateTTLResp = await this._client.updateTtl(
            RATE_LIMITER_CACHE_NAME,
            currentMinuteKey,
            RATE_LIMITER_TTL_MILLIS
          );
          if (!(updateTTLResp instanceof CacheUpdateTtl.Set)) {
            console.error(
              `Failed to update TTL; this minute's user requests might be overcounted, key: ${currentMinuteKey}`
            );
          }
        }
        return true;
      }
    } else if (resp instanceof CacheIncrement.Error) {
      throw new Error(resp.message());
    }

    return false;
  }
}
