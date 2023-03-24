import {CreateCache, DeleteCache, ListCaches} from '../../../index';

export interface ICacheClient {
  createCache(cacheName: string): Promise<CreateCache.Response>;
  deleteCache(cacheName: string): Promise<DeleteCache.Response>;
  listCaches(): Promise<ListCaches.Response>;
}
