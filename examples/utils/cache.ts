import {
  CacheClient,
  Configurations,
  CreateCache,
  EnvMomentoTokenProvider,
  MomentoLogger,
  MomentoLoggerFactory,
} from '@gomomento/sdk';

export function getCacheClient(
  loggerFactory: MomentoLoggerFactory,
  requestTimeoutMs: number,
  cacheItemTtlSeconds: number
) {
  return new CacheClient({
    configuration:
      Configurations.Laptop.v1(loggerFactory).withClientTimeoutMillis(
        requestTimeoutMs
      ),
    credentialProvider: new EnvMomentoTokenProvider({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
    defaultTtlSeconds: cacheItemTtlSeconds,
  });
}

export async function createCache(
  momentCacheClient: CacheClient,
  cacheName: string,
  logger: MomentoLogger
) {
  const createResponse = await momentCacheClient.createCache(cacheName);
  if (createResponse instanceof CreateCache.AlreadyExists) {
    logger.info(`cache '${cacheName}' already exists`);
  } else if (createResponse instanceof CreateCache.Error) {
    throw createResponse.innerException();
  }
}
