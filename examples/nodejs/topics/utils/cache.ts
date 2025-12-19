import {
  CacheClient,
  Configurations,
  MomentoLoggerFactory,
  CreateCacheResponse,
  DefaultMomentoLoggerLevel,
  DefaultMomentoLoggerFactory,
} from '@gomomento/sdk';

export async function getCacheClient(
  loggerFactory: MomentoLoggerFactory,
  requestTimeoutMs: number,
  cacheItemTtlSeconds: number
) {
  return await CacheClient.create({
    configuration: Configurations.Laptop.v1(loggerFactory).withClientTimeoutMillis(requestTimeoutMs),
    defaultTtlSeconds: cacheItemTtlSeconds,
  });
}

export async function ensureCacheExists(cacheName: string): Promise<void> {
  const loggerFactory = new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.INFO);
  const logger = loggerFactory.getLogger('ensureCacheExists');
  const momento = await getCacheClient(loggerFactory, 5000, 60);
  const createCacheResponse = await momento.createCache(cacheName);
  switch (createCacheResponse.type) {
    case CreateCacheResponse.AlreadyExists:
      logger.info('Cache already exists. Continuing.');
      break;
    case CreateCacheResponse.Success:
      logger.info('Cache created successfully. Continuing.');
      break;
    case CreateCacheResponse.Error:
      throw createCacheResponse.innerException();
  }
}
