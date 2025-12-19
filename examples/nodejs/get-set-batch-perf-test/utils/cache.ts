import {
  CacheClient,
  Configurations,
  MomentoLogger,
  MomentoLoggerFactory,
  CreateCacheResponse,
  FlushCacheResponse,
} from '@gomomento/sdk';

export function getCacheClient(
  loggerFactory: MomentoLoggerFactory,
  requestTimeoutMs: number,
  cacheItemTtlSeconds: number,
  options?: {
    maxConcurrentRequests: number;
  }
): Promise<CacheClient> {
  let config = Configurations.Laptop.v1(loggerFactory).withClientTimeoutMillis(requestTimeoutMs);
  if (options !== undefined) {
    config = config.withTransportStrategy(
      config.getTransportStrategy().withMaxConcurrentRequests(options.maxConcurrentRequests)
    );
  }
  return CacheClient.create({
    configuration: config,
    defaultTtlSeconds: cacheItemTtlSeconds,
  });
}

export async function createCache(momentCacheClient: CacheClient, cacheName: string, logger: MomentoLogger) {
  const createResponse = await momentCacheClient.createCache(cacheName);
  switch (createResponse.type) {
    case CreateCacheResponse.AlreadyExists:
      logger.info(`cache '${cacheName}' already exists`);
      break;
    case CreateCacheResponse.Success:
      logger.info('created cache');
      break;
    case CreateCacheResponse.Error:
      throw createResponse.innerException();
  }
}

export async function flushCache(momentCacheClient: CacheClient, cacheName: string, logger: MomentoLogger) {
  const flushCacheResponse = await momentCacheClient.flushCache(cacheName);
  switch (flushCacheResponse.type) {
    case FlushCacheResponse.Success:
      logger.info('Cache flushed successfully');
      break;
    case FlushCacheResponse.Error:
      throw flushCacheResponse.innerException();
  }
}
