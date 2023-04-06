import {
  CacheFlush,
  CreateCache,
  DeleteCache,
  ListCaches,
  GenerateApiToken,
} from '../../../index';

export interface IControlClient {
  createCache(cacheName: string): Promise<CreateCache.Response>;
  deleteCache(cacheName: string): Promise<DeleteCache.Response>;
  listCaches(): Promise<ListCaches.Response>;
  flushCache(cacheName: string): Promise<CacheFlush.Response>;
  generateApiToken(sessionToken: string): Promise<GenerateApiToken.Response>;
}
