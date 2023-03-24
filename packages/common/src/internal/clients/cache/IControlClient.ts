import {CreateCache, DeleteCache, ListCaches} from '../../../index';

export interface IControlClient {
  createCache(cacheName: string): Promise<CreateCache.Response>;
  deleteCache(cacheName: string): Promise<DeleteCache.Response>;
  listCaches(): Promise<ListCaches.Response>;
}
