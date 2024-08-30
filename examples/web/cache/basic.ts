import {CacheClient, CreateCacheResponse, CacheSetResponse, CacheGetResponse} from '@gomomento/sdk-web';
import {initJSDom} from './utils/jsdom';

async function main() {
  // Because the Momento Web SDK is intended for use in a browser, we use the JSDom library to set up an environment
  // that will allow us to use it in a node.js program.
  initJSDom();
  const momento = new CacheClient({
    defaultTtlSeconds: 60,
  });

  const createCacheResponse = await momento.createCache('cache');
  switch (createCacheResponse.type) {
    case CreateCacheResponse.AlreadyExists:
      console.log('cache already exists');
      break;
    case CreateCacheResponse.Success:
      console.log('cache created');
      break;
    case CreateCacheResponse.Error:
      throw createCacheResponse.innerException();
  }

  console.log('Storing key=foo, value=FOO');
  const setResponse = await momento.set('cache', 'foo', 'FOO');
  switch (setResponse.type) {
    case CacheSetResponse.Success:
      console.log('Key stored successfully!');
      break;
    case CacheSetResponse.Error:
      console.log(`Error setting key: ${setResponse.toString()}`);
      break;
  }

  const getResponse = await momento.get('cache', 'foo');
  switch (getResponse.type) {
    case CacheGetResponse.Miss:
      console.log('cache miss');
      break;
    case CacheGetResponse.Hit:
      console.log(`cache hit: ${getResponse.valueString()}`);
      break;
    case CacheGetResponse.Error:
      console.log(`Error: ${getResponse.message()}`);
      break;
  }
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
