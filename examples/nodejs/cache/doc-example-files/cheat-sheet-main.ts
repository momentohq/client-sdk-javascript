/* eslint-disable @typescript-eslint/no-unused-vars */
import {CacheGet, CreateCache, CacheSet, CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk';

function main() {
  const cacheClient = new CacheClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
    defaultTtlSeconds: 60,
  });
}

try {
  main();
} catch (e) {
  console.error(`Uncaught exception while running example: ${JSON.stringify(e)}`);
  throw e;
}
