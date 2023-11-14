import {
  CacheClient,
  CacheGet,
  CacheSet,
  Configurations,
  CreateCache,
  CredentialProvider,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
} from '@gomomento/sdk-web';
import {initJSDom} from './utils/jsdom';
import {ExperimentalRequestLoggingMiddleware} from '@gomomento/sdk-web/dist/src/config/middleware/experimental-request-logging-middleware';

async function main() {
  // Because the Momento Web SDK is intended for use in a browser, we use the JSDom library to set up an environment
  // that will allow us to use it in a node.js program.
  initJSDom();

  const loggerFactory = new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.INFO);

  const momento = new CacheClient({
    configuration: Configurations.Laptop.v1().withMiddlewares([
      new ExperimentalRequestLoggingMiddleware(loggerFactory.getLogger('basicLogger1')),
      new ExperimentalRequestLoggingMiddleware(loggerFactory.getLogger('basicLogger2')),
      new ExperimentalRequestLoggingMiddleware(loggerFactory.getLogger('basicLogger3')),
    ]),
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
