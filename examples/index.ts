import {
  CacheDelete,
  CacheGet,
  CacheSet,
  CreateCache,
  ListCaches,
  LogFormat,
  LogLevel,
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
  const createCacheResp = await momento.createCache(cacheName);
  if (createCacheResp instanceof CreateCache.AlreadyExists) {
    console.log('cache already exists');
  } else if (createCacheResp instanceof CreateCache.Error) {
    console.log(`Error creating cache: ${createCacheResp.message()}`);
    throw createCacheResp.innerException();
  }

  console.log('Listing caches:');
  let token;
  do {
    const listResp = await momento.listCaches();
    if (listResp instanceof ListCaches.Success) {
      listResp.getCaches().forEach(cacheInfo => {
        console.log(`${cacheInfo.getName()}`);
      });
      token = listResp.getNextToken();
    } else if (listResp instanceof ListCaches.Error) {
      console.log(`Error listing caches: ${listResp.message()}`);
      break;
    }
  } while (token !== null);

  const exampleTtlSeconds = 10;
  console.log(
    `Storing key=${cacheKey}, value=${cacheValue}, ttl=${exampleTtlSeconds}`
  );
  const setResp = await momento.set(
    cacheName,
    cacheKey,
    cacheValue,
    exampleTtlSeconds
  );
  if (setResp instanceof CacheSet.Success) {
    console.log('Key stored successfully with value ' + setResp.valueString());
  } else if (setResp instanceof CacheSet.Error) {
    console.log('Error setting key: ' + setResp.message());
  }

  const getResp = await momento.get(cacheName, cacheKey);
  if (getResp instanceof CacheGet.Hit) {
    console.log(`cache hit: ${getResp.valueString()}`);
  } else if (getResp instanceof CacheGet.Miss) {
    console.log(`cache miss: ${getResp.toString()}`);
  } else if (getResp instanceof CacheGet.Error) {
    console.log(`Error: ${getResp.message()}`);
  }

  const delResp = await momento.delete(cacheName, cacheKey);
  if (delResp instanceof CacheDelete.Error) {
    console.log(`Error deleting cache key: ${delResp.message()}`);
  } else {
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
