import {
  CreateCache,
  DeleteCache,
  ListCaches,
  CacheFlush,
  CreateSigningKey,
  RevokeSigningKey,
  ListSigningKeys,
} from '../../../index';

export interface IControlClient {
  createCache(cacheName: string): Promise<CreateCache.Response>;
  deleteCache(cacheName: string): Promise<DeleteCache.Response>;
  listCaches(): Promise<ListCaches.Response>;
  flushCache(cacheName: string): Promise<CacheFlush.Response>;
  createSigningKey(
    ttlMinutes: number,
    endpoint: string
  ): Promise<CreateSigningKey.Response>;
  revokeSigningKey(keyId: string): Promise<RevokeSigningKey.Response>;
  listSigningKeys(endpoint: string): Promise<ListSigningKeys.Response>;
}
