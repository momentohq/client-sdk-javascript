import {
  CacheClient,
  CacheGetBatch,
  CacheSet,
  CacheSetBatch,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
  MomentoLogger,
  MomentoLoggerFactory,
} from '@gomomento/sdk';
import {createCache, flushCache, getCacheClient} from './utils/cache';
import {
  GetSetConfig,
  initiatePerfTestContext,
  PerfTestConfiguration,
  PerfTestContext,
  PerfTestOptions,
  RequestType,
} from './utils/perf-test-options';
import {calculateSummary, getElapsedMillis} from './utils/perf-test-utils';

class PerfTest {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly logger: MomentoLogger;
  private readonly cacheItemTtlSeconds = 600;
  private readonly options: PerfTestOptions;
  private readonly cacheName = 'js-perf-test';
  private testConfiguration: PerfTestConfiguration;

  constructor(options: PerfTestOptions, testConfiguration: PerfTestConfiguration) {
    this.loggerFactory = options.loggerFactory;
    this.logger = this.loggerFactory.getLogger('get-set-batch-perf-test');
    this.options = options;
    this.testConfiguration = testConfiguration;
  }

  private logMemoryUsage(): NodeJS.Timeout {
    return setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [key, value] of Object.entries(process.memoryUsage())) {
        // this.logger.info(`Memory usage by ${key}, ${value / 1000000}MB `);
      }
    }, 5000); // Log memory usage every 5 seconds
  }

  async run(): Promise<void> {
    const defaultCacheClient = await getCacheClient(
      this.options.loggerFactory,
      this.options.requestTimeoutMs,
      this.cacheItemTtlSeconds
    );
    await createCache(defaultCacheClient, this.cacheName, this.logger);
    const cacheClientWithMaxConcurrentRequests = await getCacheClient(
      this.options.loggerFactory,
      this.options.requestTimeoutMs,
      this.cacheItemTtlSeconds,
      {maxConcurrentRequests: 100}
    );

    await this.runWithCacheClient(defaultCacheClient, false);
    await this.runWithCacheClient(cacheClientWithMaxConcurrentRequests, true);
  }

  async runWithCacheClient(cacheClient: CacheClient, useMaxConcurrentRequests: boolean): Promise<void> {
    const memoryUsageLogger = this.logMemoryUsage();

    try {
      this.logger.info('Starting async set requests');
      await this.runAsyncSetRequests(cacheClient, useMaxConcurrentRequests);

      this.logger.info('Starting async get requests');
      await this.runAsyncGetRequests(cacheClient, useMaxConcurrentRequests);

      this.logger.info('Starting set batch requests');
      await this.runSetBatchTests(cacheClient, useMaxConcurrentRequests);

      this.logger.info('Starting get batch requests');
      await this.runGetBatchTests(cacheClient, useMaxConcurrentRequests);

      // flush the cache
      await flushCache(cacheClient, this.cacheName, this.logger);
    } finally {
      clearInterval(memoryUsageLogger);
    }
  }

  async runAsyncSetRequests(momento: CacheClient, useMaxConcurrentRequests: boolean): Promise<void> {
    for (const setConfig of this.testConfiguration.sets) {
      this.logger.info(
        `Beginning run for ASYNC_SETS, batch size ${setConfig.batchSize}, item size ${setConfig.itemSizeBytes}, use max concurrent requests: ${useMaxConcurrentRequests}`
      );
      let numLoops = 0;
      const context = initiatePerfTestContext();
      while (getElapsedMillis(context.startTime) < this.testConfiguration.minimumRunDurationSecondsForTests * 1000) {
        numLoops++;
        await this.sendAsyncSetRequests(momento, context, setConfig);
      }
      calculateSummary(
        context,
        setConfig.batchSize,
        setConfig.itemSizeBytes,
        RequestType.ASYNC_SETS,
        this.logger,
        useMaxConcurrentRequests
      );
      this.logger.info(
        `Completed run for ASYNC_SETS, batch size ${setConfig.batchSize}, item size ${
          setConfig.itemSizeBytes
        }, use max concurrent requests: ${useMaxConcurrentRequests}; num loops: ${numLoops}, elapsed duration: ${getElapsedMillis(context.startTime)}ms`
      );
    }
  }

  async runAsyncGetRequests(momento: CacheClient, useMaxConcurrentRequests: boolean): Promise<void> {
    for (const getConfig of this.testConfiguration.gets) {
      this.logger.info(
        `Populating cache for ASYNC_GETS, batch size ${getConfig.batchSize}, item size ${getConfig.itemSizeBytes}, use max concurrent requests: ${useMaxConcurrentRequests}`
      );
      const cachePopulationStartTime = process.hrtime();
      // ensure that the cache is populated with the keys
      await this.ensureCacheIsPopulated(momento, getConfig);
      this.logger.info(
        `Populated cache for ASYNC_GETS, batch size ${getConfig.batchSize}, item size ${
          getConfig.itemSizeBytes
        }, use max concurrent requests: ${useMaxConcurrentRequests} in ${getElapsedMillis(cachePopulationStartTime)}ms`
      );
      this.logger.info(
        `Beginning run for ASYNC_GETS, batch size ${getConfig.batchSize}, item size ${getConfig.itemSizeBytes}, use max concurrent requests: ${useMaxConcurrentRequests}`
      );
      let numLoops = 0;
      const context = initiatePerfTestContext();
      while (getElapsedMillis(context.startTime) < this.testConfiguration.minimumRunDurationSecondsForTests * 1000) {
        // this.logger.info(`Looping; elapsed millis: ${getElapsedMillis(context.startTime)}`);
        numLoops++;
        await this.sendAsyncGetRequests(momento, context, getConfig);
      }
      calculateSummary(
        context,
        getConfig.batchSize,
        getConfig.itemSizeBytes,
        RequestType.ASYNC_GETS,
        this.logger,
        useMaxConcurrentRequests
      );
      this.logger.info(
        `Completed run for ASYNC_GETS, batch size ${getConfig.batchSize}, item size ${
          getConfig.itemSizeBytes
        }, use max concurrent requests: ${useMaxConcurrentRequests}; num loops: ${numLoops}, elapsed duration: ${getElapsedMillis(context.startTime)}ms`
      );
    }
  }

  async runSetBatchTests(momento: CacheClient, useMaxConcurrentRequests: boolean): Promise<void> {
    for (const setConfig of this.testConfiguration.sets) {
      if (setConfig.batchSize * setConfig.itemSizeBytes >= 5 * 1024 * 1024) {
        this.logger.info(
          `Skipping run for SET_BATCH, batch size ${setConfig.batchSize}, item size ${setConfig.itemSizeBytes} would exceed max request size of 5MB`
        );
        continue;
      }
      this.logger.info(
        `Beginning run for SET_BATCH, batch size ${setConfig.batchSize}, item size ${setConfig.itemSizeBytes}, use max concurrent requests: ${useMaxConcurrentRequests}`
      );
      let numLoops = 0;
      const context = initiatePerfTestContext();
      while (getElapsedMillis(context.startTime) < this.testConfiguration.minimumRunDurationSecondsForTests * 1000) {
        numLoops++;
        await this.sendSetBatchRequests(momento, context, setConfig);
      }
      calculateSummary(
        context,
        setConfig.batchSize,
        setConfig.itemSizeBytes,
        RequestType.SET_BATCH,
        this.logger,
        useMaxConcurrentRequests
      );
      this.logger.info(
        `Completed run for SET_BATCH, batch size ${setConfig.batchSize}, item size ${
          setConfig.itemSizeBytes
        }, use max concurrent requests: ${useMaxConcurrentRequests} ; num loops: ${numLoops}, elapsed duration: ${getElapsedMillis(context.startTime)}ms`
      );
    }
  }

  async runGetBatchTests(momento: CacheClient, useMaxConcurrentRequests: boolean): Promise<void> {
    for (const getConfig of this.testConfiguration.gets) {
      this.logger.info(
        `Populating cache for GET_BATCH, batch size ${getConfig.batchSize}, item size ${getConfig.itemSizeBytes}, use max concurrent requests: ${useMaxConcurrentRequests}`
      );
      const cachePopulationStartTime = process.hrtime();
      // ensure that the cache is populated with the keys
      await this.ensureCacheIsPopulated(momento, getConfig);
      this.logger.info(
        `Populated cache for GET_BATCH, batch size ${getConfig.batchSize}, item size ${
          getConfig.itemSizeBytes
        }, use max concurrent requests: ${useMaxConcurrentRequests} in ${getElapsedMillis(cachePopulationStartTime)}ms`
      );
      this.logger.info(
        `Beginning run for GET_BATCH, batch size ${getConfig.batchSize}, item size ${getConfig.itemSizeBytes}, use max concurrent requests: ${useMaxConcurrentRequests}`
      );
      let numLoops = 0;
      const context = initiatePerfTestContext();
      while (getElapsedMillis(context.startTime) < this.testConfiguration.minimumRunDurationSecondsForTests * 1000) {
        numLoops++;
        await this.sendGetBatchRequests(momento, context, getConfig);
      }
      calculateSummary(
        context,
        getConfig.batchSize,
        getConfig.itemSizeBytes,
        RequestType.GET_BATCH,
        this.logger,
        useMaxConcurrentRequests
      );
      this.logger.info(
        `Completed run for GET_BATCH, batch size ${getConfig.batchSize}, item size ${
          getConfig.itemSizeBytes
        }, use max concurrent requests: ${useMaxConcurrentRequests}; num loops: ${numLoops}, elapsed duration: ${getElapsedMillis(context.startTime)}ms`
      );
    }
  }

  private async sendAsyncSetRequests(
    momento: CacheClient,
    context: PerfTestContext,
    setConfig: GetSetConfig
  ): Promise<void> {
    const setPromises: Promise<CacheSet.Response>[] = [];
    const value = 'x'.repeat(setConfig.itemSizeBytes);
    const setStartTime = process.hrtime();
    for (let i = 0; i < setConfig.batchSize; i++) {
      const key = `key-${i}`;
      const setPromise = momento.set(this.cacheName, key, value);
      setPromises.push(setPromise);
      context.totalItemSizeBytes += setConfig.itemSizeBytes;
    }
    const setResponses = await Promise.all(setPromises);
    const setDuration = getElapsedMillis(setStartTime);
    const error = setResponses.find(response => response instanceof CacheSet.Error);
    if (error !== undefined) {
      throw new Error(`Error in async sets: ${error.toString()}`);
    }
    context.asyncSetLatencies.recordValue(setDuration);
  }

  private async sendAsyncGetRequests(
    momento: CacheClient,
    context: PerfTestContext,
    getConfig: GetSetConfig
  ): Promise<void> {
    const getPromises: Promise<CacheSet.Response>[] = [];
    const getStartTime = process.hrtime();
    for (let i = 0; i < getConfig.batchSize; i++) {
      const key = `key-${i}`;
      const getPromise = momento.get(this.cacheName, key);
      getPromises.push(getPromise);
      context.totalItemSizeBytes += getConfig.itemSizeBytes;
    }
    const getResponses = await Promise.all(getPromises);
    const getDuration = getElapsedMillis(getStartTime);
    const error = getResponses.find(response => response instanceof CacheSet.Error);
    if (error !== undefined) {
      throw new Error(`Error in async gets: ${error.toString()}`);
    }
    context.asyncGetLatencies.recordValue(getDuration);
  }

  private async sendSetBatchRequests(
    momento: CacheClient,
    context: PerfTestContext,
    setConfig: GetSetConfig
  ): Promise<void> {
    const keys = Array.from({length: setConfig.batchSize}, (_, i) => `key-${i}`);
    const values = Array.from({length: setConfig.batchSize}, () => 'x'.repeat(setConfig.itemSizeBytes));
    const items = new Map<string, string>();
    keys.forEach((key, index) => {
      items.set(key, values[index]);
    });
    const setBatchStartTime = process.hrtime();
    const setBatchPromise = momento.setBatch(this.cacheName, items);

    context.totalItemSizeBytes += setConfig.batchSize * setConfig.itemSizeBytes;
    const setBatchResponse = await setBatchPromise;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (setBatchResponse instanceof CacheSetBatch.Error) {
      throw new Error(`Error setting batch: ${setBatchResponse.toString()}`);
    }
    const setBatchDuration = getElapsedMillis(setBatchStartTime);
    context.setBatchLatencies.recordValue(setBatchDuration);
  }

  private async sendGetBatchRequests(
    momento: CacheClient,
    context: PerfTestContext,
    getConfig: GetSetConfig
  ): Promise<void> {
    const keys = Array.from({length: getConfig.batchSize}, (_, i) => `key-${i}`);
    const getBatchStartTime = process.hrtime();
    const getBatchPromise = momento.getBatch(this.cacheName, keys);
    context.totalItemSizeBytes += getConfig.batchSize * getConfig.itemSizeBytes;
    const getBatchResponse = await getBatchPromise;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (getBatchResponse instanceof CacheGetBatch.Error) {
      throw new Error(`Error getting batch: ${getBatchResponse.toString()}`);
    }
    const getBatchDuration = getElapsedMillis(getBatchStartTime);
    context.getBatchLatencies.recordValue(getBatchDuration);
  }

  private async ensureCacheIsPopulated(momento: CacheClient, getConfig: GetSetConfig) {
    const keys = Array.from({length: getConfig.batchSize}, (_, i) => `key-${i}`);
    const values = Array.from({length: getConfig.batchSize}, () => 'x'.repeat(getConfig.itemSizeBytes));

    for (let i = 0; i < keys.length; i++) {
      await momento.setIfAbsent(this.cacheName, keys[i], values[i]);
    }
  }
}

async function main(perfTestOptions: PerfTestOptions, testConfiguration: PerfTestConfiguration): Promise<void> {
  const perfTest = new PerfTest(perfTestOptions, testConfiguration);
  await perfTest.run();
}

const batchSizeOptions = [5, 10, 100, 500, 1_000, 5_000, 10_000];
const itemSizeOptions = [10, 100, 1024, 1024 * 10, 1024 * 100, 1024 * 1024];

const testConfiguration: PerfTestConfiguration = {
  minimumRunDurationSecondsForTests: 5,
  sets: generateConfigurations(batchSizeOptions, itemSizeOptions),
  gets: generateConfigurations(batchSizeOptions, itemSizeOptions),
};

function generateConfigurations(batchSizes: number[], itemSizes: number[]): GetSetConfig[] {
  const configurations: GetSetConfig[] = [];
  for (const batchSize of batchSizes) {
    for (const itemSize of itemSizes) {
      // exclude permutations where the total payload is greater than 1GB, they are not realistic and
      // will cause memory issues
      if (batchSize * itemSize < 1024 * 1024 * 1024) {
        configurations.push({batchSize, itemSizeBytes: itemSize});
      }
    }
  }
  return configurations;
}

const perfTestOptions: PerfTestOptions = {
  loggerFactory: new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.DEBUG),
  requestTimeoutMs: 600000, // 10 minutes to avoid hitting TimeoutError from grpc
};

main(perfTestOptions, testConfiguration).catch((e: Error) => {
  console.error(`Uncaught exception while running load gen: ${e.message}`);
  throw e;
});
