import {
  CacheGet,
  ListCaches,
  CreateCache,
  CacheSet,
  CacheDelete,
  SimpleCacheClient,
  Configurations,
  MomentoLoggerFactory,
  DefaultMomentoLoggerFactory,
  CredentialProvider,
} from '@gomomento/sdk';
import {range} from './utils/collections';

const cacheName = 'cache';
const cacheKey = 'key';
const cacheValue = 'value';

// you can customize your log level or provide your own logger factory to
// integrate with your favorite logging framework
const loggerFactory: MomentoLoggerFactory = new DefaultMomentoLoggerFactory();

const momento = new SimpleCacheClient({
  configuration: Configurations.Laptop.latest(loggerFactory),
  credentialProvider: CredentialProvider.fromEnvironmentVariable({
    environmentVariableName: 'MOMENTO_AUTH_TOKEN',
  }),
  defaultTtlSeconds: 60,
});

async function main() {
  await createCacheExample();
  await listCachesExample();
  await setGetDeleteExample();
  await concurrentGetsExample();
}

async function createCacheExample() {
  const createCacheResponse = await momento.createCache(cacheName);
  if (createCacheResponse instanceof CreateCache.AlreadyExists) {
    console.log('cache already exists');
  } else if (createCacheResponse instanceof CreateCache.Error) {
    throw createCacheResponse.innerException();
  } else {
    throw new Error(`Unexpected response: ${createCacheResponse.toString()}`);
  }
}

async function listCachesExample() {
  console.log('Listing caches:');
  const listResponse = await momento.listCaches();
  if (listResponse instanceof ListCaches.Error) {
    console.log(`Error listing caches: ${listResponse.message()}`);
  } else if (listResponse instanceof ListCaches.Success) {
    console.log('Found caches:');
    listResponse.getCaches().forEach(cacheInfo => {
      console.log(`${cacheInfo.getName()}`);
    });
  }
}

async function setGetDeleteExample() {
  // ttl is an optional field on most write operations, but you can provide it if you
  // want to override the default ttl that you specified when constructing your client.
  const exampleTtlSeconds = 10;
  console.log(
    `Storing key=${cacheKey}, value=${cacheValue}, ttl=${exampleTtlSeconds}`
  );
  const setResponse = await momento.set(cacheName, cacheKey, cacheValue, {
    ttl: exampleTtlSeconds,
  });
  if (setResponse instanceof CacheSet.Success) {
    console.log('Key stored successfully!');
  } else if (setResponse instanceof CacheSet.Error) {
    console.log(`Error setting key: ${setResponse.message()}`);
  }

  const getResponse = await momento.get(cacheName, cacheKey);
  if (getResponse instanceof CacheGet.Hit) {
    console.log(`cache hit: ${String(getResponse.valueString())}`);
  } else if (getResponse instanceof CacheGet.Miss) {
    console.log('cache miss');
  } else if (getResponse instanceof CacheGet.Error) {
    console.log(`Error: ${getResponse.message()}`);
  }

  const deleteResponse = await momento.delete(cacheName, cacheKey);
  if (deleteResponse instanceof CacheDelete.Error) {
    console.log(`Error deleting cache key: ${deleteResponse.message()}`);
  } else if (deleteResponse instanceof CacheDelete.Success) {
    console.log('Deleted key from cache');
  }
}

async function concurrentGetsExample() {
  console.log('Saving 10 values to cache');
  for (let i = 1; i <= 10; i++) {
    await momento.set(cacheName, `key${i}`, `value${i}`);
  }
  console.log('Initiating 10 concurrent gets');
  const getPromises = range(10).map(i => momento.get(cacheName, `key${i + 1}`));
  const getResponses = await Promise.all(getPromises);
  getResponses.forEach((response, index) => {
    const key = `key${index + 1}`;
    if (response instanceof CacheGet.Hit) {
      console.log(
        `Concurrent get for ${key} returned ${response.valueString()}`
      );
    } else {
      console.log(
        `Something went wrong with concurrent get for key ${key}: ${response.toString()}`
      );
    }
  });
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`failed to get from cache ${e.message}`);
    throw e;
  });
