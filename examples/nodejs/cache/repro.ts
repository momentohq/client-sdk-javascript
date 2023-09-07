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
    const key = `key${i}`;
    const set = await client.set('cache', key, 'value');
    if (set instanceof CacheSet.Error) {
      console.log('Error: ', set.message());
    }
    const get = await client.get('cache', key);
    if (get instanceof CacheGet.Error) {
      console.log('Error: ', get.message());
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
