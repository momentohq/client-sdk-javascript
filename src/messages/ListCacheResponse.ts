import {control} from '@momento/wire-types-typescript';

export class ListCacheResponse {
  private readonly result: control.control_client.ListCachesResponse;
  private readonly nextToken: string;
  private readonly caches: string[];

  constructor(result: control.control_client.ListCachesResponse) {
    this.nextToken = result.next_token !== '' ? result.next_token : '';
    this.caches = [];
    result.cache.forEach(cache => this.caches.push(cache.cache_name));
  }

  public getNextToken() {
    return this.nextToken;
  }

  public getCaches() {
    return this.caches;
  }
}
