import {
  CacheGet,
  ListCaches,
  CreateCache,
  CacheSet,
  CacheDelete,
  CacheClient,
  Configurations,
  MomentoLoggerFactory,
  DefaultMomentoLoggerFactory,
  CredentialProvider,
} from '@gomomento/sdk-web';
import {range} from './utils/collections';
import {initJSDom} from './utils/jsdom';

const cacheName = 'cache';
const cacheKey = 'key';
const cacheValue = 'value';

// you can customize your log level or provide your own logger factory to
// integrate with your favorite logging framework
const loggerFactory: MomentoLoggerFactory = new DefaultMomentoLoggerFactory();
const logger = loggerFactory.getLogger('AdvancedExample');

const momento = new CacheClient({
  configuration: Configurations.Laptop.v1(loggerFactory),
  credentialProvider: CredentialProvider.fromEnvironmentVariable({
    environmentVariableName: 'MOMENTO_API_KEY',
  }),
  defaultTtlSeconds: 60,
});

async function main() {
  // Because the Momento Web SDK is intended for use in a browser, we use the JSDom library to set up an environment
  // that will allow us to use it in a node.js program.
  initJSDom();
  await createCacheExample();
  await listCachesExample();
  await setGetDeleteExample();
  await concurrentGetsExample();
}

async function createCacheExample() {
  const createCacheResponse = await momento.createCache(cacheName);
  if (createCacheResponse instanceof CreateCache.AlreadyExists) {
    logger.info('cache already exists');
  } else if (createCacheResponse instanceof CreateCache.Error) {
    throw createCacheResponse.innerException();
  } else {
    throw new Error(`Unexpected response: ${createCacheResponse.toString()}`);
  }
}

async function listCachesExample() {
  logger.info('Listing caches:');
  const listResponse = await momento.listCaches();
  if (listResponse instanceof ListCaches.Error) {
    logger.info(`Error listing caches: ${listResponse.message()}`);
  } else if (listResponse instanceof ListCaches.Success) {
    logger.info('Found caches:');
    listResponse.getCaches().forEach(cacheInfo => {
      logger.info(`${cacheInfo.getName()}`);
    });
  } else {
    throw new Error(`Unrecognized response: ${listResponse.toString()}`);
  }
}

async function setGetDeleteExample() {
  // ttl is an optional field on most write operations, but you can provide it if you
  // want to override the default ttl that you specified when constructing your client.
  const exampleTtlSeconds = 10;
  logger.info(`Storing key=${cacheKey}, value=${cacheValue}, ttl=${exampleTtlSeconds}`);
  const setResponse = await momento.set(cacheName, cacheKey, cacheValue, {
    ttl: exampleTtlSeconds,
  });
  if (setResponse instanceof CacheSet.Success) {
    logger.info('Key stored successfully!');
  } else if (setResponse instanceof CacheSet.Error) {
    logger.info(`Error setting key: ${setResponse.message()}`);
  } else {
    throw new Error(`Unrecognized response: ${setResponse.toString()}`);
  }

  const getResponse = await momento.get(cacheName, cacheKey);
  if (getResponse instanceof CacheGet.Hit) {
    logger.info(`cache hit: ${getResponse.valueString()}`);
  } else if (getResponse instanceof CacheGet.Miss) {
    logger.info('cache miss');
  } else if (getResponse instanceof CacheGet.Error) {
    logger.info(`Error: ${getResponse.message()}`);
  } else {
    throw new Error(`Unrecognized response: ${getResponse.toString()}`);
  }

  const deleteResponse = await momento.delete(cacheName, cacheKey);
  if (deleteResponse instanceof CacheDelete.Error) {
    logger.info(`Error deleting cache key: ${deleteResponse.message()}`);
  } else if (deleteResponse instanceof CacheDelete.Success) {
    logger.info('Deleted key from cache');
  } else {
    throw new Error(`Unrecognized response: ${deleteResponse.toString()}`);
  }
}

async function concurrentGetsExample() {
  logger.info('Saving 10 values to cache');
  for (let i = 1; i <= 10; i++) {
    await momento.set(cacheName, `key${i}`, `value${i}`);
  }
  logger.info('Initiating 10 concurrent gets');
  const getPromises = range(10).map(i => momento.get(cacheName, `key${i + 1}`));
  const getResponses = await Promise.all(getPromises);
  getResponses.forEach((response, index) => {
    const key = `key${index + 1}`;
    if (response instanceof CacheGet.Hit) {
      logger.info(`Concurrent get for ${key} returned ${response.valueString()}`);
    } else {
      logger.info(`Something went wrong with concurrent get for key ${key}: ${response.toString()}`);
    }
  });
}

main()
  .then(() => {
    logger.info('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
