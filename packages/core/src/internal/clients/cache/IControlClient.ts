import {CacheFlush, CreateCache, DeleteCache, ListCaches} from '../../../index';
import {CancellationCallOptions} from '../../../utils';
export type CacheOptions = CancellationCallOptions;
export interface IControlClient {
  createCache(
    cacheName: string,
    options?: CacheOptions
  ): Promise<CreateCache.Response>;
  deleteCache(
    cacheName: string,
    options?: CacheOptions
  ): Promise<DeleteCache.Response>;
  listCaches(options?: CacheOptions): Promise<ListCaches.Response>;
  flushCache(
    cacheName: string,
    options?: CacheOptions
  ): Promise<CacheFlush.Response>;
  close(): void;
}
