import {control} from '@gomomento/generated-types';
import {CacheInfo} from './CacheInfo';

export class ListCachesResponse {
  private readonly nextToken: string | null;
  private readonly caches: CacheInfo[];

  constructor(result?: control.control_client._ListCachesResponse) {
    this.nextToken = result?.next_token || null;
    this.caches = [];
    result?.cache.forEach(cache =>
      this.caches.push(new CacheInfo(cache.cache_name))
    );
  }

  public getNextToken() {
    return this.nextToken;
  }

  public getCaches() {
    return this.caches;
  }
}
