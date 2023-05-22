/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/ban-ts-comment */
import {CacheGet, CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk-web';
// @ts-ignore
// This global is required in order to use the Web SDK outside of a browser
global.XMLHttpRequest = require('xhr2');
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
