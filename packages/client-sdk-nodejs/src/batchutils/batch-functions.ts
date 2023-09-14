import {CacheDelete, CacheGet, CacheSet} from '@gomomento/sdk-core';
import {CacheClient} from '../cache-client';
import {
  BatchDeleteRequest,
  BatchDeleteResponse,
  BatchGetRequest,
  BatchGetResponse,
  BatchSetItem,
  BatchSetRequest,
  BatchSetResponse,
  defaultMaxConcurrentRequests,
} from './batch-props';
import {range} from '@gomomento/sdk-core/dist/src/internal/utils';

export {
  BatchDeleteRequest,
  BatchDeleteResponse,
  BatchGetRequest,
  BatchGetResponse,
  BatchSetItem,
  BatchSetRequest,
  BatchSetResponse,
  defaultMaxConcurrentRequests,
};

export async function batchGet(
  request: BatchGetRequest
): Promise<BatchGetResponse> {
  const maxConcurrentGets = request.maxConcurrentGets
    ? request.maxConcurrentGets
    : Math.min(defaultMaxConcurrentRequests, request.keys.length);

  const batchGetResults = range(maxConcurrentGets).map((workerId: number) =>
    getWorker(workerId, request.cacheClient, request.cacheName, request.keys)
  );
  const awaitAll = await Promise.all(batchGetResults);

  const batchGetResponse: BatchGetResponse = {};
  awaitAll.forEach(responses => {
    for (const key of Object.keys(responses)) {
      batchGetResponse[key] = responses[key];
    }
  });
  return batchGetResponse;
}

async function getWorker(
  workerId: number,
  cacheClient: CacheClient,
  cacheName: string,
  keys: Array<string>
): Promise<Record<string, CacheGet.Response>> {
  const responses: Record<string, CacheGet.Response> = {};
  while (keys.length) {
    const cacheKey = keys.pop();
    if (cacheKey !== undefined) {
      responses[cacheKey] = await cacheClient.get(cacheName, cacheKey);
    }
  }
  return Promise.resolve(responses);
}

export async function batchSet(
  request: BatchSetRequest
): Promise<BatchSetResponse> {
  const maxConcurrentSets = request.maxConcurrentSets
    ? request.maxConcurrentSets
    : Math.min(defaultMaxConcurrentRequests, request.items.length);

  const batchSetResults = range(maxConcurrentSets).map((workerId: number) =>
    setWorker(workerId, request.cacheClient, request.cacheName, request.items)
  );
  const awaitAll = await Promise.all(batchSetResults);

  const batchSetResponse: BatchSetResponse = {};
  awaitAll.forEach(responses => {
    for (const key of Object.keys(responses)) {
      batchSetResponse[key] = responses[key];
    }
  });
  return batchSetResponse;
}

async function setWorker(
  workerId: number,
  cacheClient: CacheClient,
  cacheName: string,
  items: Array<BatchSetItem>
): Promise<Record<string, CacheSet.Response>> {
  const responses: Record<string, CacheSet.Response> = {};
  while (items.length) {
    const item = items.pop();
    if (item !== undefined) {
      responses[item.key] = await cacheClient.set(
        cacheName,
        item.key,
        item.value
      );
    }
  }
  return Promise.resolve(responses);
}

export async function batchDelete(
  request: BatchDeleteRequest
): Promise<BatchDeleteResponse> {
  const maxConcurrentDeletes = request.maxConcurrentDeletes
    ? request.maxConcurrentDeletes
    : Math.min(defaultMaxConcurrentRequests, request.keys.length);

  const batchDeleteResults = range(maxConcurrentDeletes).map(
    (workerId: number) =>
      deleteWorker(
        workerId,
        request.cacheClient,
        request.cacheName,
        request.keys
      )
  );
  const awaitAll = await Promise.all(batchDeleteResults);

  const batchDeleteResponse: BatchDeleteResponse = {};
  awaitAll.forEach(responses => {
    for (const key of Object.keys(responses)) {
      batchDeleteResponse[key] = responses[key];
    }
  });
  return batchDeleteResponse;
}

async function deleteWorker(
  workerId: number,
  cacheClient: CacheClient,
  cacheName: string,
  keys: Array<string>
): Promise<Record<string, CacheDelete.Response>> {
  const responses: Record<string, CacheDelete.Response> = {};
  while (keys.length) {
    const cacheKey = keys.pop();
    if (cacheKey !== undefined) {
      responses[cacheKey] = await cacheClient.delete(cacheName, cacheKey);
    }
  }
  return Promise.resolve(responses);
}
