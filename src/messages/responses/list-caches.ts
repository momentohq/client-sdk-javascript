import {CacheInfo} from '../cache-info';
import {control} from '@gomomento/generated-types';
import * as ResponseBase from './response-base';

export {Response, Error} from './response-base';

export class Success extends ResponseBase.Success {
  private readonly nextToken?: string;
  private readonly caches: CacheInfo[];
  constructor(result?: control.control_client._ListCachesResponse) {
    super();
    this.nextToken = result?.next_token;
    if (result) {
      this.caches = result.cache.map(cache => new CacheInfo(cache.cache_name));
    }
  }

  public getNextToken() {
    return this.nextToken;
  }

  public getCaches() {
    return this.caches;
  }

  public override toString() {
    const caches = this.caches.map(cacheInfo => cacheInfo.getName());
    return super.toString() + ': ' + caches.join(', ');
  }
}
