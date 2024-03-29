import {
  CacheClient,
  CacheSet,
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

  async run(): Promise<void> {
    const momento = await getCacheClient(
      this.options.loggerFactory,
      this.options.requestTimeoutMs,
      this.cacheItemTtlSeconds
    );
    await createCache(momento, this.cacheName, this.logger);

    this.logger.info('Starting async set requests');
    await this.runAsyncSetRequests(momento);

    this.logger.info('Starting async get requests');
    await this.runAsyncGetRequests(momento);

    this.logger.info('Starting set batch requests');
    await this.runSetBatchTests(momento);

    this.logger.info('Starting get batch requests');
    await this.runGetBatchTests(momento);

    // flush the cache
    await flushCache(momento, this.cacheName, this.logger);
  }

  async runAsyncSetRequests(momento: CacheClient): Promise<void> {
    for (const setConfig of this.testConfiguration.sets) {
      const context = initiatePerfTestContext();
      while (getElapsedMillis(context.startTime) < this.testConfiguration.minimumRunDurationSecondsForTests * 1000) {
        await this.sendAsyncSetRequests(momento, context, setConfig);
      }
      calculateSummary(context, setConfig.batchSize, setConfig.itemSizeBytes, RequestType.ASYNC_SETS, this.logger);
    }
  }

  async runAsyncGetRequests(momento: CacheClient): Promise<void> {
    for (const getConfig of this.testConfiguration.gets) {
      // ensure that the cache is populated with the keys
      await this.ensureCacheIsPopulated(momento, getConfig);
      const context = initiatePerfTestContext();
      while (getElapsedMillis(context.startTime) < this.testConfiguration.minimumRunDurationSecondsForTests * 1000) {
        await this.sendAsyncGetRequests(momento, context, getConfig);
      }
      calculateSummary(context, getConfig.batchSize, getConfig.itemSizeBytes, RequestType.ASYNC_GETS, this.logger);
    }
  }

  async runSetBatchTests(momento: CacheClient): Promise<void> {
    for (const setConfig of this.testConfiguration.sets) {
      const context = initiatePerfTestContext();
      while (getElapsedMillis(context.startTime) < this.testConfiguration.minimumRunDurationSecondsForTests * 1000) {
        await this.sendSetBatchRequests(momento, context, setConfig);
      }
      calculateSummary(context, setConfig.batchSize, setConfig.itemSizeBytes, RequestType.SET_BATCH, this.logger);
    }
  }

  async runGetBatchTests(momento: CacheClient): Promise<void> {
    for (const getConfig of this.testConfiguration.gets) {
      // ensure that the cache is populated with the keys
      await this.ensureCacheIsPopulated(momento, getConfig);
      const context = initiatePerfTestContext();
      while (getElapsedMillis(context.startTime) < this.testConfiguration.minimumRunDurationSecondsForTests * 1000) {
        await this.sendGetBatchRequests(momento, context, getConfig);
      }
      calculateSummary(context, getConfig.batchSize, getConfig.itemSizeBytes, RequestType.GET_BATCH, this.logger);
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
    await Promise.all(setPromises).then(() => {
      const setDuration = getElapsedMillis(setStartTime);
      context.asyncSetLatencies.recordValue(setDuration);
    });
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
    await Promise.all(getPromises).then(() => {
      const setDuration = getElapsedMillis(getStartTime);
      context.asyncGetLatencies.recordValue(setDuration);
    });
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

    void setBatchPromise.then(() => {
      const setBatchDuration = getElapsedMillis(setBatchStartTime);
      context.setBatchLatencies.recordValue(setBatchDuration);
    });
    context.totalItemSizeBytes += setConfig.batchSize * setConfig.itemSizeBytes;
    await setBatchPromise;
  }

  private async sendGetBatchRequests(
    momento: CacheClient,
    context: PerfTestContext,
    getConfig: GetSetConfig
  ): Promise<void> {
    const keys = Array.from({length: getConfig.batchSize}, (_, i) => `key-${i}`);
    const getBatchStartTime = process.hrtime();
    const getBatchPromise = momento.getBatch(this.cacheName, keys);
    void getBatchPromise.then(() => {
      const getBatchDuration = getElapsedMillis(getBatchStartTime);
      context.getBatchLatencies.recordValue(getBatchDuration);
    });
    context.totalItemSizeBytes += getConfig.batchSize * getConfig.itemSizeBytes;
    await getBatchPromise;
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
      configurations.push({batchSize, itemSizeBytes: itemSize});
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
