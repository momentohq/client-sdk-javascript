import {
  CacheClient,
  CacheFlush,
  CacheSet,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
  MomentoLogger,
  MomentoLoggerFactory,
} from '@gomomento/sdk';
import {createCache, getCacheClient} from './utils/cache';
import {GetSetConfig, PerfTestConfiguration, PerfTestOptions, RequestType} from './utils/perf-test-options';
import {calculateSummary, getElapsedMillis} from './utils/perf-test-utils';

class PerfTest {
  private readonly momentoClientPromise: Promise<CacheClient>;
  private momento: CacheClient;
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly logger: MomentoLogger;
  private readonly cacheItemTtlSeconds = 600;
  private readonly options: PerfTestOptions;
  private readonly testConfiguration: PerfTestConfiguration;
  private readonly cacheName: string = 'js-perf-test';
  private totalRequests = 0;
  private totalItemSizeBytes = 0;
  private completionTimes: number[] = [];

  constructor(options: PerfTestOptions, testConfiguration: PerfTestConfiguration) {
    this.loggerFactory = options.loggerFactory;
    this.logger = this.loggerFactory.getLogger('get-set-batch-perf-test');
    this.options = options;
    this.testConfiguration = testConfiguration;
    this.momentoClientPromise = this.createMomentoClient(options);
  }

  private createMomentoClient(options: PerfTestOptions): Promise<CacheClient> {
    return getCacheClient(options.loggerFactory, options.requestTimeoutMs, this.cacheItemTtlSeconds);
  }
  async createCache(): Promise<void> {
    this.momento = await this.momentoClientPromise;
    await createCache(this.momento, this.cacheName, this.logger);
  }

  async flushCache(): Promise<void> {
    const res = await this.momento.flushCache(this.cacheName);
    if (res instanceof CacheFlush.Success) {
      this.logger.info('Cache flushed successfully');
    } else if (res instanceof CacheFlush.Error) {
      throw res.innerException();
    }
  }

  async runAsyncSetRequests(): Promise<void> {
    for (const setConfig of this.testConfiguration.sets) {
      const startTime = process.hrtime();
      while (getElapsedMillis(startTime) < this.testConfiguration.minimumRunDurationSecondsForTests * 1000) {
        await this.sendAsyncSetRequests(this.momento, setConfig);
      }

      calculateSummary(
        this.totalRequests,
        this.totalItemSizeBytes,
        this.testConfiguration.minimumRunDurationSecondsForTests,
        setConfig.batchSize,
        setConfig.itemSizeBytes,
        this.completionTimes,
        RequestType.ASYNC_SETS,
        this.logger
      );
      this.totalRequests = 0;
      this.totalItemSizeBytes = 0;
      this.completionTimes = [];
    }
  }

  async runAsyncGetRequests(): Promise<void> {
    for (const getConfig of this.testConfiguration.gets) {
      const startTime = process.hrtime();
      while (getElapsedMillis(startTime) < this.testConfiguration.minimumRunDurationSecondsForTests * 1000) {
        await this.sendAsyncGetRequests(this.momento, getConfig);
      }

      calculateSummary(
        this.totalRequests,
        this.totalItemSizeBytes,
        this.testConfiguration.minimumRunDurationSecondsForTests,
        getConfig.batchSize,
        getConfig.itemSizeBytes,
        this.completionTimes,
        RequestType.ASYNC_GETS,
        this.logger
      );
      this.totalRequests = 0;
      this.totalItemSizeBytes = 0;
      this.completionTimes = [];
    }
  }

  async runSetBatchTests(): Promise<void> {
    for (const setConfig of this.testConfiguration.sets) {
      const startTime = process.hrtime();
      while (getElapsedMillis(startTime) < this.testConfiguration.minimumRunDurationSecondsForTests * 1000) {
        await this.sendSetBatchRequests(this.momento, setConfig);
      }

      calculateSummary(
        this.totalRequests,
        this.totalItemSizeBytes,
        this.testConfiguration.minimumRunDurationSecondsForTests,
        setConfig.batchSize,
        setConfig.itemSizeBytes,
        this.completionTimes,
        RequestType.SET_BATCH,
        this.logger
      );
      this.totalRequests = 0;
      this.totalItemSizeBytes = 0;
      this.completionTimes = [];
    }
  }

  async runGetBatchTests(): Promise<void> {
    for (const getConfig of this.testConfiguration.gets) {
      const startTime = process.hrtime();
      while (getElapsedMillis(startTime) < this.testConfiguration.minimumRunDurationSecondsForTests * 1000) {
        await this.sendGetBatchRequests(this.momento, getConfig);
      }

      calculateSummary(
        this.totalRequests,
        this.totalItemSizeBytes,
        this.testConfiguration.minimumRunDurationSecondsForTests,
        getConfig.batchSize,
        getConfig.itemSizeBytes,
        this.completionTimes,
        RequestType.GET_BATCH,
        this.logger
      );
      this.totalRequests = 0;
      this.totalItemSizeBytes = 0;
      this.completionTimes = [];
    }
  }

  private async sendAsyncSetRequests(momento: CacheClient, setConfig: GetSetConfig): Promise<void> {
    const setPromises: Promise<CacheSet.Response>[] = [];
    for (let i = 0; i < setConfig.batchSize; i++) {
      const key = `key-${i}`;
      const value = 'x'.repeat(setConfig.itemSizeBytes);
      const setPromise = this.asyncSet(momento, key, value);
      setPromises.push(setPromise);
      this.totalRequests++;
      this.totalItemSizeBytes += setConfig.itemSizeBytes;
    }
    await Promise.all(setPromises);
  }

  private async sendAsyncGetRequests(momento: CacheClient, getConfig: GetSetConfig): Promise<void> {
    const getPromises: Promise<CacheSet.Response>[] = [];
    for (let i = 0; i < getConfig.batchSize; i++) {
      const key = `key-${i}`;
      const getPromise = this.asyncGet(momento, key);
      getPromises.push(getPromise);
      this.totalRequests++;
      this.totalItemSizeBytes += getConfig.itemSizeBytes;
    }
    await Promise.all(getPromises);
  }

  private async sendSetBatchRequests(momento: CacheClient, setConfig: GetSetConfig): Promise<void> {
    const keys = Array.from({length: setConfig.batchSize}, (_, i) => `key-${i}`);
    const values = Array.from({length: setConfig.batchSize}, () => 'x'.repeat(setConfig.itemSizeBytes));
    const items = new Map<string, string>();
    keys.forEach((key, index) => {
      items.set(key, values[index]);
    });
    const setBatchPromise = momento.setBatch(this.cacheName, items);
    this.totalRequests += setConfig.batchSize;
    this.totalItemSizeBytes += setConfig.batchSize * setConfig.itemSizeBytes;
    await setBatchPromise;
  }

  private async sendGetBatchRequests(momento: CacheClient, getConfig: GetSetConfig): Promise<void> {
    const keys = Array.from({length: getConfig.batchSize}, (_, i) => `key-${i}`);
    const getBatchPromise = momento.getBatch(this.cacheName, keys);
    this.totalRequests += getConfig.batchSize;
    this.totalItemSizeBytes += getConfig.batchSize * getConfig.itemSizeBytes;
    await getBatchPromise;
  }

  private asyncSet(momento: CacheClient, key: string, value: string): Promise<CacheSet.Response> {
    const startTime = process.hrtime();
    const setPromise = momento.set(this.cacheName, key, value);
    void setPromise.then(() => {
      const elapsedMillis = getElapsedMillis(startTime);
      this.completionTimes.push(elapsedMillis);
    });
    return setPromise;
  }

  private asyncGet(momento: CacheClient, key: string): Promise<CacheSet.Response> {
    const startTime = process.hrtime();
    const getPromise = momento.get(this.cacheName, key);
    void getPromise.then(() => {
      const elapsedMillis = getElapsedMillis(startTime);
      this.completionTimes.push(elapsedMillis);
    });
    return getPromise;
  }
}

async function main(perfTestOptions: PerfTestOptions, testConfiguration: PerfTestConfiguration): Promise<void> {
  const perfTest = new PerfTest(perfTestOptions, testConfiguration);
  await perfTest.createCache();

  // Run async set requests and record the result
  await perfTest.runAsyncSetRequests();

  // Run async get requests and record the result
  await perfTest.runAsyncGetRequests();

  // Run setBatch requests and record the result
  await perfTest.runSetBatchTests();

  // Run getBatch requests and record the result
  await perfTest.runGetBatchTests();

  // flush cache
  await perfTest.flushCache();
}

const testConfiguration: PerfTestConfiguration = {
  minimumRunDurationSecondsForTests: 15,
  sets: [
    {batchSize: 5, itemSizeBytes: 500},
    {batchSize: 5, itemSizeBytes: 1_000},
  ],
  gets: [
    {batchSize: 5, itemSizeBytes: 500},
    {batchSize: 5, itemSizeBytes: 1_000},
  ],
};

const perfTestOptions: PerfTestOptions = {
  loggerFactory: new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.DEBUG),
  requestTimeoutMs: 600000, // 10 minutes to avoid hitting TimeoutError from grpc
};

main(perfTestOptions, testConfiguration).catch((e: Error) => {
  console.error(`Uncaught exception while running load gen: ${e.message}`);
  throw e;
});
