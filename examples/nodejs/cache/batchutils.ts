import {
  CacheDelete,
  CacheGet,
  CacheSet,
  CacheClient,
  Configurations,
  CredentialProvider,
  CreateCache,
  BatchUtils,
} from '@gomomento/sdk';

const cacheName = 'cache';

async function main() {
  const cacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: 60,
  });

  const createCacheResponse = await cacheClient.createCache(cacheName);
  if (createCacheResponse instanceof CreateCache.AlreadyExists) {
    console.log('cache already exists');
  } else if (createCacheResponse instanceof CreateCache.Error) {
    throw createCacheResponse.innerException();
  }

  const items: Array<BatchUtils.BatchSetItem> = [
    {key: 'a', value: 'apple'},
    {key: 'b', value: 'berry'},
    {key: 'c', value: 'cantaloupe'},
    {key: '1', value: 'first'},
    {key: '2', value: 'second'},
    {key: '3', value: 'third'},
  ];
  const setResponse = await BatchUtils.batchSet(cacheClient, cacheName, items);
  console.log('\nValues set for the following keys?');
  for (const [key, resp] of Object.entries(setResponse)) {
    console.log(`\t|${key}: ${String(resp instanceof CacheSet.Success)}`);
  }

  const getResponse = await BatchUtils.batchGet(cacheClient, cacheName, ['a', 'b', 'c', '1', '2', '3']);
  console.log('\nValues fetched for the following keys?');
  for (const [key, resp] of Object.entries(getResponse)) {
    console.log(`\t|${key}: ${String(resp instanceof CacheGet.Hit)} | value: ${(resp as CacheGet.Hit).value()}`);
  }

  const deleteResponse = await BatchUtils.batchDelete(cacheClient, cacheName, ['a', 'b', 'c', '1', '2', '3']);
  console.log('\nValues deleted for the following keys?');
  for (const [key, resp] of Object.entries(deleteResponse)) {
    console.log(`\t|${key}: ${String(resp instanceof CacheDelete.Success)}`);
  }
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running batchutils example: ${e.message}`);
    throw e;
  });
