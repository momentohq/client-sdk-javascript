import {
  CacheClient,
  Configurations,
  MomentoLoggerFactory,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
  CredentialProvider,
  MiddlewareFactory,
  CreateCacheResponse,
  ListCachesResponse,
  CacheSetResponse,
  CacheGetResponse,
  CacheDeleteResponse,
} from '@gomomento/sdk';
import { range } from './utils/collections';
import * as fs from 'fs';
import { delay } from './utils/time';

const cacheName = 'cache';
const cacheKey = 'key';
const cacheValue = 'value';

// you can customize your log level or provide your own logger factory to
// integrate with your favorite logging framework
const loggerFactory: MomentoLoggerFactory = new DefaultMomentoLoggerFactory();
const logger = loggerFactory.getLogger('AdvancedExample');

let momento: CacheClient;

async function main() {
  momento = await CacheClient.create({
    configuration: Configurations.Laptop.v1(loggerFactory),
    credentialProvider: CredentialProvider.fromEnvVarV2(),
    defaultTtlSeconds: 60,
  });
  await createCacheExample();
  await listCachesExample();
  await setGetDeleteExample();
  await concurrentGetsExample();
  await middlewaresExample();
}

async function createCacheExample() {
  const createCacheResponse = await momento.createCache(cacheName);
  switch (createCacheResponse.type) {
    case CreateCacheResponse.AlreadyExists:
      logger.info('cache already exists');
      break;
    case CreateCacheResponse.Success:
      logger.info('cache created');
      break;
    case CreateCacheResponse.Error:
      throw createCacheResponse.innerException();
  }
}

async function listCachesExample() {
  logger.info('Listing caches:');
  const listResponse = await momento.listCaches();
  switch (listResponse.type) {
    case ListCachesResponse.Success:
      logger.info('Found caches:');
      listResponse.getCaches().forEach(cacheInfo => {
        logger.info(`${cacheInfo.getName()}`);
      });
      break;
    case ListCachesResponse.Error:
      logger.info(`Error listing caches: ${listResponse.message()}`);
      break;
  }
}

async function setGetDeleteExample() {
  // ttl is an optional field on most write operations, but you can provide it if you
  // want to override the default ttl that you specified when constructing your client.
  const exampleTtlSeconds = 10;
  logger.info(`Storing key=${cacheKey}, value=${cacheValue}, ttl=${exampleTtlSeconds}`);
  const setResponse = await momento.set(cacheName, cacheKey, cacheValue, {
    ttl: exampleTtlSeconds,
  });
  switch (setResponse.type) {
    case CacheSetResponse.Success:
      logger.info('Key stored successfully!');
      break;
    case CacheSetResponse.Error:
      logger.info(`Error setting key: ${setResponse.message()}`);
      break;
  }

  const getResponse = await momento.get(cacheName, cacheKey);
  switch (getResponse.type) {
    case CacheGetResponse.Miss:
      logger.info('cache miss');
      break;
    case CacheGetResponse.Hit:
      logger.info(`cache hit: ${getResponse.valueString()}`);
      break;
    case CacheGetResponse.Error:
      logger.info(`Error: ${getResponse.message()}`);
      break;
  }

  const deleteResponse = await momento.delete(cacheName, cacheKey);
  switch (deleteResponse.type) {
    case CacheDeleteResponse.Success:
      logger.info('Deleted key from cache');
      break;
    case CacheDeleteResponse.Error:
      logger.info(`Error deleting cache key: ${deleteResponse.message()}`);
      break;
  }
}

async function concurrentGetsExample() {
  logger.info('Saving 10 values to cache');
  for (let i = 1; i <= 10; i++) {
    await momento.set(cacheName, `key${i}`, `value${i}`);
  }
  logger.info('Initiating 10 concurrent gets');
  const getPromises = range(10).map(i => momento.get(cacheName, `key${i + 1}`));
  const getResponses = await Promise.all(getPromises);
  getResponses.forEach((response, index) => {
    const key = `key${index + 1}`;
    if (response.type === CacheGetResponse.Hit) {
      logger.info(`Concurrent get for ${key} returned ${response.valueString()}`);
    } else {
      logger.info(`Something went wrong with concurrent get for key ${key}: ${response.toString()}`);
    }
  });
}

async function middlewaresExample() {
  const middlewaresExampleloggerFactory: MomentoLoggerFactory = new DefaultMomentoLoggerFactory(
    DefaultMomentoLoggerLevel.DEBUG
  );
  const middlewaresExamplelogger = middlewaresExampleloggerFactory.getLogger('AdvancedMiddlewaresExample');
  middlewaresExamplelogger.info('Constructing a new Momento client with logging and metrics middlewares enabled');

  const metricsCsvPath = './advanced-middlewares-example-metrics.csv';

  const middlewaresExampleClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(middlewaresExampleloggerFactory).withMiddlewares(
      MiddlewareFactory.createMetricsMiddlewares(loggerFactory, {
        // this logs a periodic JSON for the event loop statistics of your nodejs process
        eventLoopMetricsLog: true,
        // this writes a unique row for each Momento request (latency, activeRequestCount) to
        // a csv file as specified by this path
        perRequestMetricsCSVPath: metricsCsvPath,
      })
    ),
    credentialProvider: CredentialProvider.fromEnvVarV2(),
    defaultTtlSeconds: 60,
  });

  middlewaresExamplelogger.info(
    'Issuing 2 set and get requests to demonstrate middleware request logging and metrics.'
  );

  for (let i = 0; i < 2; i++) {
    await middlewaresExampleClient.set(cacheName, `middleware${i}`, 'VALUE');
    await middlewaresExampleClient.get(cacheName, `middleware${i}`);
    await delay(500);
  }

  // wait for metrics to flush to disk
  await delay(100);

  logger.info(`Here are the contents of the metrics csv file:\n\n${fs.readFileSync(metricsCsvPath).toString()}`);

  middlewaresExamplelogger.info('Middlewares example complete!');
  // close the client to gracefully shut down connection and middlewares
  middlewaresExampleClient.close();
}

main()
  .then(() => {
    logger.info('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
