import {
  CacheClient,
  Configurations,
  CreateCache,
  EnvMomentoTokenProvider,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
  MomentoLogger,
  MomentoLoggerFactory,
} from '@gomomento/sdk-web';

export function getCacheClient(
  loggerFactory: MomentoLoggerFactory,
  requestTimeoutMs: number,
  cacheItemTtlSeconds: number
) {
  return new CacheClient({
    configuration: Configurations.Laptop.v1(loggerFactory).withClientTimeoutMillis(requestTimeoutMs),
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

export async function ensureCacheExists(cacheName: string): Promise<void> {
  const loggerFactory = new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.INFO);
  const momento = getCacheClient(loggerFactory, 5000, 60);
  const createCacheResponse = await momento.createCache(cacheName);
  if (createCacheResponse instanceof CreateCache.Success) {
    console.log('Cache created successfully. Continuing.');
  } else if (createCacheResponse instanceof CreateCache.AlreadyExists) {
    console.log('Cache already exists. Continuing.');
  } else if (createCacheResponse instanceof CreateCache.Error) {
    throw createCacheResponse.innerException();
  } else {
    throw new Error(`Unknown create cache response type: ${createCacheResponse.toString()}`);
  }
}
