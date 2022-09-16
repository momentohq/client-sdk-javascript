import {
  AlreadyExistsError,
  CacheGetStatus,
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
    level: LogLevel.DEBUG,
    format: LogFormat.CONSOLE,
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
  await momento.set(cacheName, cacheKey, cacheValue, exampleTtlSeconds);
  const getResp = await momento.get(cacheName, cacheKey);

  if (getResp.status === CacheGetStatus.Hit) {
    console.log(`cache hit: ${String(getResp.text())}`);
  } else {
    console.log('cache miss');
  }
};

main()
  .then(() => {
    console.log('success!!');
  })
  .catch(e => {
    console.error('failed to get from cache', e);
  });
