import {
  AlreadyExistsError,
  CacheGet,
  CacheSet,
  CacheDelete,
  LogLevel,
  LogFormat,
  SimpleCacheClient,
} from '@gomomento/sdk';

const cacheName = 'cachefoo';
const cacheKey = 'key!!';
const cacheValue = 'value!!';
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
  try {
    await momento.createCache(cacheName);
  } catch (e) {
    if (e instanceof AlreadyExistsError) {
      console.log('cache already exists');
    } else {
      throw e;
    }
  }

  console.log('Listing caches:');
  let token;
  do {
    const listResp = await momento.listCaches();
    listResp.getCaches().forEach(cacheInfo => {
      console.log(`${cacheInfo.getName()}`);
    });
    token = listResp.getNextToken();
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
  } else {
    console.log('Error setting key: ' + setResp.toString());
  }

  const delResp = await momento.delete('___', cacheKey);
  if (delResp instanceof CacheDelete.Error) {
    console.log('Error deleting cache key: ' + delResp.message());
  }

  const getResp = await momento.get(cacheName, cacheKey);

  if (getResp instanceof CacheGet.Hit) {
    console.log(`cache hit: ${getResp.valueString()}`);
  } else if (getResp instanceof CacheGet.Miss) {
    console.log('cache miss');
  } else if (getResp instanceof CacheGet.Error) {
    console.log('Error: ' + getResp.toString());
  }
};

main()
  .then(() => {
    console.log('success!!');
  })
  .catch(e => {
    console.error('failed to get from cache', e);
  });
