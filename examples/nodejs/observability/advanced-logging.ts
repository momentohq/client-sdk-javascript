import {CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk';
import {PinoMomentoLoggerFactory} from './pino-logger';

function example_observability_CreateCacheClientWithPinoLogger() {
  return CacheClient.create({
    configuration: Configurations.Laptop.v1(
      new PinoMomentoLoggerFactory({
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
      })
    ),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({environmentVariableName: 'MOMENTO_AUTH_TOKEN'}),
    defaultTtlSeconds: 60,
  });
}

async function main() {
  const cacheClient = await example_observability_CreateCacheClientWithPinoLogger();
  await cacheClient.createCache('test-cache');
  await cacheClient.set('test-cache', 'foo', 'FOO!');
  await cacheClient.get('test-cache', 'foo');
}

main().catch(e => {
  throw e;
});
