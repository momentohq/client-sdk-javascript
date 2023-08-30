import {CacheGet, CreateCache, CacheSet, CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk';

async function main() {
  const clients: CacheClient[] = [];

  for (let i = 0; i < 2; i++) {
    const momento = await CacheClient.create({
      configuration: Configurations.Laptop.v1(),
      credentialProvider: CredentialProvider.fromEnvironmentVariable({
        environmentVariableName: 'MOMENTO_AUTH_TOKEN',
      }),
      defaultTtlSeconds: 60,
    });
    clients.push(momento);
  }

  for (let i = 0; i < 1000; i++) {
    const client = clients[i % 2];
    const createCacheResponse = await client.createCache(i.toString());
    await client.listCaches();
    if (
      createCacheResponse instanceof CreateCache.Success ||
      createCacheResponse instanceof CreateCache.AlreadyExists
    ) {
      await client.deleteCache(i.toString());
    }
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
