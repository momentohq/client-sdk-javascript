import {CacheGet, CacheSet, CacheDelete} from '@gomomento/sdk-core';

export const defaultMaxConcurrentRequests = 5;
export const defaultTtlSeconds = 60;

export interface BatchFunctionOptions {
  maxConcurrentRequests?: number;
}

export type BatchGetOptions = BatchFunctionOptions;

export type BatchGetResponse = Record<string, CacheGet.Response>;

export type BatchSetOptions = BatchFunctionOptions;

export interface BatchSetItem {
  key: string | Uint8Array;
  value: string | Uint8Array;
  ttl?: number;
}

export type BatchSetResponse = Record<string, CacheSet.Response>;

export type BatchDeleteOptions = BatchFunctionOptions;

export type BatchDeleteResponse = Record<string, CacheDelete.Response>;
