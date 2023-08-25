/**
 *
 * This file contains examples of consuming the JavaScript APIs, for use as examples
 * in the public dev docs.  Each function name that begins with `example_` is available
 * to the dev docs to inject into the code snippets widget for the specified API.
 *
 * These examples should all be JavaScript; we can add TypeScript-specific examples in
 * a second file in the future if desired.
 *
 */
import {CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk';
import {ExampleMetricMiddleware} from '../example-metric-middleware';

async function example_API_InstantiateCacheClientWithMiddleware() {
  await CacheClient.create({
    configuration: Configurations.Laptop.v1().addMiddleware(new ExampleMetricMiddleware()),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
    defaultTtlSeconds: 60,
  });
}

async function main() {
  await example_API_InstantiateCacheClientWithMiddleware();
}

main();
