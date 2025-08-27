import {CacheFlush, CreateCache, DeleteCache, ListCaches} from '../../../index';
import {CancellationCallOptions} from '../../../utils';
export type ControlCallOptions = CancellationCallOptions;
export interface IControlClient {
  createCache(
    cacheName: string,
    options?: ControlCallOptions
  ): Promise<CreateCache.Response>;
  deleteCache(
    cacheName: string,
    options?: ControlCallOptions
  ): Promise<DeleteCache.Response>;
  listCaches(options?: ControlCallOptions): Promise<ListCaches.Response>;
  flushCache(
    cacheName: string,
    options?: ControlCallOptions
  ): Promise<CacheFlush.Response>;
  close(): void;
}
