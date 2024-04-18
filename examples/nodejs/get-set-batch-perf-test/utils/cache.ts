import {
  CacheClient,
  Configurations,
  CreateCache,
  EnvMomentoTokenProvider,
  MomentoLogger,
  MomentoLoggerFactory,
  CacheFlush,
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
    credentialProvider: new EnvMomentoTokenProvider({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: cacheItemTtlSeconds,
  });
}

export async function createCache(momentCacheClient: CacheClient, cacheName: string, logger: MomentoLogger) {
  const createResponse = await momentCacheClient.createCache(cacheName);
  if (createResponse instanceof CreateCache.AlreadyExists) {
    logger.info(`cache '${cacheName}' already exists`);
  } else if (createResponse instanceof CreateCache.Error) {
    throw createResponse.innerException();
  }
}

export async function flushCache(momentCacheClient: CacheClient, cacheName: string, logger: MomentoLogger) {
  const flushCacheResponse = await momentCacheClient.flushCache(cacheName);
  if (flushCacheResponse instanceof CacheFlush.Success) {
    logger.info('Cache flushed successfully');
  } else if (flushCacheResponse instanceof CacheFlush.Error) {
    throw flushCacheResponse.innerException();
  }
}
