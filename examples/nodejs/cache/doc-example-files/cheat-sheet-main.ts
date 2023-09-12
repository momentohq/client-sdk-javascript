/* eslint-disable @typescript-eslint/no-unused-vars */
import {CacheGet, CreateCache, CacheSet, CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk';

async function main() {
  const cacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: 60,
  });
}

main().catch(e => {
  console.error(`Uncaught exception while running example: ${JSON.stringify(e)}`);
  throw e; // Depending on the environment, this might not be necessary.
});
