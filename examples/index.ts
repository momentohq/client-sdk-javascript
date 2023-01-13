import {
  CacheGet,
  ListCaches,
  CreateCache,
  CacheSet,
  CacheDelete,
  LogLevel,
  LogFormat,
  SimpleCacheClient,
} from '@gomomento/sdk';

const cacheName = 'cache';
const cacheKey = 'key';
const cacheValue = 'value';
const authToken = process.env.MOMENTO_AUTH_TOKEN;
if (!authToken) {
  throw new Error('Missing required environment variable MOMENTO_AUTH_TOKEN');
}

const defaultTtl = 60;
const momento = new SimpleCacheClient(authToken, defaultTtl, {
  loggerOptions: {
    level: LogLevel.INFO,
    format: LogFormat.JSON,
  },
});

const main = async () => {
  const createCacheResponse = await momento.createCache(cacheName);
  if (createCacheResponse instanceof CreateCache.AlreadyExists) {
    console.log('cache already exists');
  } else if (createCacheResponse instanceof CreateCache.Error) {
    throw createCacheResponse.innerException();
  }

  console.log('Listing caches:');
  let token;
  do {
    const listResponse = await momento.listCaches();
    if (listResponse instanceof ListCaches.Error) {
      console.log(`Error listing caches: ${listResponse.message()}`);
      break;
    } else if (listResponse instanceof ListCaches.Success) {
      listResponse.getCaches().forEach(cacheInfo => {
        console.log(`${cacheInfo.getName()}`);
      });
      token = listResponse.getNextToken();
    }
  } while (token !== null);

  const exampleTtlSeconds = 10;
  console.log(
    `Storing key=${cacheKey}, value=${cacheValue}, ttl=${exampleTtlSeconds}`
  );
  const setResponse = await momento.set(
    cacheName,
    cacheKey,
    cacheValue,
    exampleTtlSeconds
  );
  if (setResponse instanceof CacheSet.Success) {
    console.log(
      'Key stored successfully with value ' + setResponse.valueString()
    );
  } else if (setResponse instanceof CacheSet.Error) {
    console.log('Error setting key: ' + setResponse.message());
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
};

main()
  .then(() => {
    console.log('success!!');
  })
  .catch(e => {
    console.error('failed to get from cache', e);
  });
