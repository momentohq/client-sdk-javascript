import {CacheGet, CreateCache, CacheSet, CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk';

async function main() {
  const momento = new CacheClient({
    configuration: Configurations.Lambda.latest(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: 60,
  });

  // const createCacheResponse = await momento.createCache('cache');
  // if (createCacheResponse instanceof CreateCache.AlreadyExists) {
  //   console.log('cache already exists');
  // } else if (createCacheResponse instanceof CreateCache.Error) {
  //   throw createCacheResponse.innerException();
  // }

}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
