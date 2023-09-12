import {CacheGet, CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk-web';
import {initJSDom} from './utils/jsdom';
async function main() {
  // Because the Momento Web SDK is intended for use in a browser, we use the JSDom library to set up an environment
  // that will allow us to use it in a node.js program.
  initJSDom();
  const cacheClient = new CacheClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: 60,
  });

  await cacheClient.createCache('cache');
  await cacheClient.set('cache', 'foo', 'FOO');
  const getResponse = await cacheClient.get('cache', 'foo');
  if (getResponse instanceof CacheGet.Hit) {
    console.log(`Got value: ${getResponse.valueString()}`);
  }
}

main().catch(e => {
  throw e;
});
