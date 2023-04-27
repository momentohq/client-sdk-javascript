import {
  CacheClient,
  Configurations,
  CredentialProvider,
  CreateCache,
  CacheSet,
} from '@gomomento/sdk';

async function example_API_CreateCache(cacheClient: CacheClient) {
  const result = await cacheClient.createCache('my-cache');
  if (result instanceof CreateCache.Success) {
    console.log("Cache 'my-cache' created");
  } else if (result instanceof CreateCache.AlreadyExists) {
    console.log("Cache 'my-cache' already exists");
  } else {
    throw new Error(
      `An error occurred while attempting to create cache 'my-cache': ${result.toString()}`
    );
  }
}

async function example_API_Set(cacheClient: CacheClient) {
  const result = await cacheClient.set('my-cache', 'someKey', 'someValue');
  if (result instanceof CacheSet.Success) {
    console.log("Key 'someKey' stored successfully");
  } else {
    throw new Error(
      `An error occurred while attempting to store key 'someKey' in cache 'my-cache': ${result.toString()}`
    );
  }
}
async function main() {
  const cacheClient = new CacheClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
    defaultTtlSeconds: 60,
  });

  await example_API_CreateCache(cacheClient);

  await example_API_Set(cacheClient);
}

main().catch(e => {
  throw e;
});
