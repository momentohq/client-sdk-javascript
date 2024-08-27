import {
  CacheClient,
  Configurations,
  EnvMomentoTokenProvider,
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
    credentialProvider: new EnvMomentoTokenProvider({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: cacheItemTtlSeconds,
  });
}

export async function ensureCacheExists(cacheName: string) {
  const loggerFactory = new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.INFO);
  const cacheClient = await getCacheClient(loggerFactory, 5000, 60);
  const createResponse = await cacheClient.createCache(cacheName);
  switch (createResponse.type) {
    case CreateCacheResponse.AlreadyExists:
      console.info(`cache '${cacheName}' already exists`);
      break;
    case CreateCacheResponse.Success:
      console.info(`cache '${cacheName}' created`);
      break;
    case CreateCacheResponse.Error:
      throw createResponse.innerException();
  }
}
