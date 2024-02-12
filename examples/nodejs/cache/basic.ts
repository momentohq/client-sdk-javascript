<<<<<<< Updated upstream


import {CacheGet, CreateCache, CacheSet, CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk';
=======
import {
  CacheClient,
  CacheGet,
  CacheSet,
  Configurations,
  CreateCache,
  CredentialProvider,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel, ExperimentalMetricsLoggingMiddleware, MomentoLoggerFactory
} from '@gomomento/sdk';
>>>>>>> Stashed changes

async function main() {
  const logger: MomentoLoggerFactory = new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.DEBUG);
  const momento = await CacheClient.create({
    configuration: Configurations.Lambda.latest(logger)
      .withMiddlewares([new ExperimentalMetricsLoggingMiddleware(logger)])
      .withClientTimeoutMillis(2000),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: 60,
  });

  const createCacheResponse = await momento.createCache('cache');
  if (createCacheResponse instanceof CreateCache.AlreadyExists) {
    console.log('cache already exists');
  } else if (createCacheResponse instanceof CreateCache.Error) {
    throw createCacheResponse.innerException();
  }

  console.log('Storing key=foo, value=FOO');
  const setResponse = await momento.set('cache', 'foo', 'FOO');
  if (setResponse instanceof CacheSet.Success) {
    console.log('Key stored successfully!');
  } else {
    console.log(`Error setting key: ${setResponse.toString()}`);
  }

  const getResponse = await momento.get('cache', 'foo');
  if (getResponse instanceof CacheGet.Hit) {
    console.log(`cache hit: ${getResponse.valueString()}`);
  } else if (getResponse instanceof CacheGet.Miss) {
    console.log('cache miss');
  } else if (getResponse instanceof CacheGet.Error) {
    console.log(`Error: ${getResponse.message()}`);
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
