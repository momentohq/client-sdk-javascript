import {CacheGet, CacheSet, CacheDelete} from '@gomomento/sdk-core';
import {CacheClient} from '../cache-client';

export const defaultMaxConcurrentRequests = 5;

export interface BatchGetRequest {
  cacheClient: CacheClient;
  cacheName: string;
  keys: Array<string>;
  maxConcurrentGets?: number;
}

export type BatchGetResponse = Record<string, CacheGet.Response>;

export interface BatchSetItem {
  key: string;
  value: string;
}

export interface BatchSetRequest {
  cacheClient: CacheClient;
  cacheName: string;
  items: Array<BatchSetItem>;
  maxConcurrentSets?: number;
}

export type BatchSetResponse = Record<string, CacheSet.Response>;

export interface BatchDeleteRequest {
  cacheClient: CacheClient;
  cacheName: string;
  keys: Array<string>;
  maxConcurrentDeletes?: number;
}

export type BatchDeleteResponse = Record<string, CacheDelete.Response>;
