import {CacheGet, CacheSet, CacheDelete} from '@gomomento/sdk-core';

export const defaultMaxConcurrentRequests = 5;
export const defaultTtlSeconds = 60;

export interface BatchGetOptions {
  maxConcurrentGets?: number;
}

export type BatchGetResponse = Record<string, CacheGet.Response>;

export interface BatchSetOptions {
  ttl?: number;
  maxConcurrentSets?: number;
}

export type BatchSetResponse = Record<string, CacheSet.Response>;

export interface BatchDeleteOptions {
  maxConcurrentDeletes?: number;
}

export type BatchDeleteResponse = Record<string, CacheDelete.Response>;
