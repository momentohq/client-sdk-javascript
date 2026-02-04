import {CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk-web';
import {initJSDom} from './utils/jsdom';
async function main() {
  // Because the Momento Web SDK is intended for use in a browser, we use the JSDom library to set up an environment
  // that will allow us to use it in a node.js program.
  initJSDom();
  const cacheClient = new CacheClient({
    configuration: Configurations.Laptop.v1(),
    defaultTtlSeconds: 60,
  });

  await cacheClient.createCache('cache');
  await cacheClient.set('cache', 'foo', 'FOO');
  const getResponse = await cacheClient.get('cache', 'foo');
  console.log(`Value: ${getResponse.value() ?? 'CACHE MISS OR ERROR'}`);
}

main().catch(e => {
  throw e;
});
