/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {control} from '@momento/wire-types-typescript';

export class ListCacheResponse {
  private readonly result: control.control_client.ListCachesResponse;
  private readonly next_token: string;
  private readonly caches: string[];

  constructor(result: control.control_client.ListCachesResponse) {
    this.next_token = result.next_token !== '' ? result.next_token : '';
    this.caches = [];
    result.cache.forEach(cache => this.caches.push(cache.cache_name));
  }
}
