import {
  BatchUtils,
  CacheClient,
  CacheDeleteResponse,
  CacheGetResponse,
  CacheSetResponse,
  Configurations,
  CreateCacheResponse,
  CredentialProvider,
} from '@gomomento/sdk';

const cacheName = 'cache';

async function main() {
  const cacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvVarV2(),
    defaultTtlSeconds: 60,
  });

  const createCacheResponse = await cacheClient.createCache(cacheName);
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

  const items: Array<BatchUtils.BatchSetItem> = [
    { key: 'a', value: 'apple' },
    { key: 'b', value: 'berry' },
    { key: 'c', value: 'cantaloupe' },
    { key: '1', value: 'first' },
    { key: '2', value: 'second' },
    { key: '3', value: 'third' },
  ];
  const setResponse = await BatchUtils.batchSet(cacheClient, cacheName, items);
  console.log('\nValues set for the following keys?');
  for (const [key, resp] of Object.entries(setResponse)) {
    console.log(`\t|${key}: ${String(resp.type === CacheSetResponse.Success)}`);
  }

  const getResponse = await BatchUtils.batchGet(cacheClient, cacheName, ['a', 'b', 'c', '1', '2', '3']);
  console.log('\nValues fetched for the following keys?');
  for (const [key, resp] of Object.entries(getResponse)) {
    console.log(`\t|${key}: ${String(resp.type === CacheGetResponse.Hit)} | value: ${String(resp.value())}`);
  }

  const deleteResponse = await BatchUtils.batchDelete(cacheClient, cacheName, ['a', 'b', 'c', '1', '2', '3']);
  console.log('\nValues deleted for the following keys?');
  for (const [key, resp] of Object.entries(deleteResponse)) {
    console.log(`\t|${key}: ${String(resp.type === CacheDeleteResponse.Success)}`);
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
