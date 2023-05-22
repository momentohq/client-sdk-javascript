import {CacheGet, CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk';

async function main() {
  const momento = new CacheClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
    defaultTtlSeconds: 60,
  });

  const createCacheResponse = await momento.createCache('cache');
  const setResponse = await momento.set('cache', 'foo', 'FOO');
  const getResponse = await momento.get('cache', 'foo');
  if (getResponse instanceof CacheGet.Hit) {
    console.log(`Got value: ${getResponse.valueString()}`);
  }
}

main().catch(e => {
  throw e;
});
