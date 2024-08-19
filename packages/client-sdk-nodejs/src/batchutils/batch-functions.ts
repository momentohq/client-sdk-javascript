import {
  CacheDelete,
  CacheGet,
  CacheSet,
  ICacheClient,
} from '@gomomento/sdk-core';
import {
  BatchDeleteOptions,
  BatchDeleteResponse,
  BatchGetOptions,
  BatchGetResponse,
  BatchSetOptions,
  BatchSetResponse,
  BatchSetItem,
  defaultMaxConcurrentRequests,
  defaultTtlSeconds,
} from './batch-props';
import {range} from '@gomomento/sdk-core/dist/src/internal/utils';

export {
  BatchDeleteOptions,
  BatchDeleteResponse,
  BatchGetOptions,
  BatchGetResponse,
  BatchSetOptions,
  BatchSetResponse,
  BatchSetItem,
  defaultMaxConcurrentRequests,
  defaultTtlSeconds,
};

// Note: all promises in batch request workers have a client-side timeout deadline
// because grpc request timeouts are baked into the cache client. The timeout can be
// overridden using the `withClientTimeoutMillis` function.

export async function batchGet(
  cacheClient: ICacheClient,
  cacheName: string,
  keys: Array<string | Uint8Array>,
  options?: BatchGetOptions
): Promise<BatchGetResponse> {
  const maxConcurrentGets = options?.maxConcurrentRequests
    ? options.maxConcurrentRequests
    : Math.min(defaultMaxConcurrentRequests, keys.length);

  const batchGetResults = range(maxConcurrentGets).map((workerId: number) =>
    getWorker(workerId, cacheClient, cacheName, keys)
  );
  const awaitAll = await Promise.all(batchGetResults);

  const batchGetResponse: BatchGetResponse = {};
  awaitAll.forEach(responses => {
    Object.assign(batchGetResponse, responses);
  });
  return batchGetResponse;
}

async function getWorker(
  workerId: number,
  cacheClient: ICacheClient,
  cacheName: string,
  keys: Array<string | Uint8Array>
): Promise<Record<string, CacheGet.Response>> {
  const responses: Record<string, CacheGet.Response> = {};
  while (keys.length) {
    const cacheKey = keys.pop();
    if (cacheKey != null) {
      responses[String(cacheKey)] = await cacheClient.get(cacheName, cacheKey);
    }
  }
  return Promise.resolve(responses);
}

export async function batchSet(
  cacheClient: ICacheClient,
  cacheName: string,
  items: Array<BatchSetItem>,
  options?: BatchSetOptions
): Promise<BatchSetResponse> {
  const maxConcurrentSets = options?.maxConcurrentRequests
    ? options.maxConcurrentRequests
    : Math.min(defaultMaxConcurrentRequests, items.length);

  const batchSetResults = range(maxConcurrentSets).map((workerId: number) =>
    setWorker(workerId, cacheClient, cacheName, items)
  );
  const awaitAll = await Promise.all(batchSetResults);

  const batchSetResponse: BatchSetResponse = {};
  awaitAll.forEach(responses => {
    Object.assign(batchSetResponse, responses);
  });
  return batchSetResponse;
}

async function setWorker(
  workerId: number,
  cacheClient: ICacheClient,
  cacheName: string,
  items: Array<BatchSetItem>
): Promise<Record<string, CacheSet.Response>> {
  const responses: Record<string, CacheSet.Response> = {};
  while (items.length) {
    const item = items.pop();
    if (item != null) {
      responses[String(item.key)] = await cacheClient.set(
        cacheName,
        item.key,
        item.value,
        {ttl: item.ttl ? item.ttl : defaultTtlSeconds}
      );
    }
  }
  return Promise.resolve(responses);
}

export async function batchDelete(
  cacheClient: ICacheClient,
  cacheName: string,
  keys: Array<string | Uint8Array>,
  options?: BatchDeleteOptions
): Promise<BatchDeleteResponse> {
  const maxConcurrentDeletes = options?.maxConcurrentRequests
    ? options.maxConcurrentRequests
    : Math.min(defaultMaxConcurrentRequests, keys.length);

  const batchDeleteResults = range(maxConcurrentDeletes).map(
    (workerId: number) => deleteWorker(workerId, cacheClient, cacheName, keys)
  );
  const awaitAll = await Promise.all(batchDeleteResults);

  const batchDeleteResponse: BatchDeleteResponse = {};
  awaitAll.forEach(responses => {
    Object.assign(batchDeleteResponse, responses);
  });
  return batchDeleteResponse;
}

async function deleteWorker(
  workerId: number,
  cacheClient: ICacheClient,
  cacheName: string,
  keys: Array<string | Uint8Array>
): Promise<Record<string, CacheDelete.Response>> {
  const responses: Record<string, CacheDelete.Response> = {};
  while (keys.length) {
    const cacheKey = keys.pop();
    if (cacheKey != null) {
      responses[String(cacheKey)] = await cacheClient.delete(
        cacheName,
        cacheKey
      );
    }
  }
  return Promise.resolve(responses);
}
