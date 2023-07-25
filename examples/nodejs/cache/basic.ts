import {CacheGet, CacheSet, CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk';
import {uuid} from 'uuidv4';

async function delay(millis: number) {
  return await new Promise(resolve => {
    setTimeout(resolve, millis);
  });
}

async function main() {
  const momento = new CacheClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
    defaultTtlSeconds: 60,
  });

  const cacheName = process.env.MOMENTO_CACHE_NAME || 'w00t';
  const millisToDelay = 250;
  console.log("using cache", cacheName);
  /* eslint-disable no-constant-condition */
  while (true) {
    const key = uuid();
    const value = uuid();

    const setResponse = await momento.set(cacheName, key, value);
    if (setResponse instanceof CacheSet.Success) {
      console.log('Key stored successfully!');
    } else {
      console.log(`Error setting key: ${setResponse.toString()}`);
    }

    const getResponse = await momento.get(cacheName, key);
    if (getResponse instanceof CacheGet.Hit) {
      console.log(`cache hit: ${getResponse.valueString()}`);
    } else if (getResponse instanceof CacheGet.Miss) {
      console.log('cache miss');
    } else if (getResponse instanceof CacheGet.Error) {
      console.log(`Error: ${getResponse.message()}`);
    }

    await delay(millisToDelay);
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
