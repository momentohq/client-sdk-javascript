import {
  CacheClient,
  CacheSortedSetFetch, CacheSortedSetLength, CacheSortedSetPutElement,
  CacheSortedSetRemoveElements,
} from '@gomomento/sdk';
import {AbstractRateLimiter} from './rate-limiter';

export class SlidingWindowLogRateLimiter extends AbstractRateLimiter {
  _client: CacheClient;
  _limit: number;
  _cacheName: string;

  constructor(client: CacheClient, limit: number, cacheName: string) {
    super();
    this._client = client;
    this._limit = limit;
    this._cacheName = cacheName;
  }

  public async isLimitExceeded(id: string): Promise<boolean> {

      const timeMinus60SecondsMillis = this.getTimeMinus60SecondsMillis();
      const currentTimeMillis = this.getCurrentTimeMillis();

      const oldElements = await this._client.sortedSetFetchByScore(this._cacheName,
        id, {minScore: 0, maxScore: timeMinus60SecondsMillis});

      if (oldElements instanceof CacheSortedSetFetch.Hit) {
        const elements = oldElements.value().map(v => v.value);
        const removeResp = await this._client.sortedSetRemoveElements(this._cacheName, id, elements);
        if (removeResp instanceof CacheSortedSetRemoveElements.Success) {
          const sortedSetPutResp = await this._client.sortedSetPutElement(this._cacheName, id, String(currentTimeMillis),
            currentTimeMillis);
          if (sortedSetPutResp instanceof CacheSortedSetPutElement.Success) {
            const len = await this._client.sortedSetLength(this._cacheName, id);
            if (len instanceof CacheSortedSetLength.Hit) {
              if (len.length() < this._limit) {
                return true;
              }
            }
          }
        }
      }

      return false;

  }

  private getCurrentTimeMillis() {
    return new Date().valueOf();
  }

  private getTimeMinus60SecondsMillis() {
    const date = new Date();
    date.setSeconds(date.getSeconds() - 60);
    return date.valueOf();
  }

}
