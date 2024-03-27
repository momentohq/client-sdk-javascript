import {
  CacheClient,
  CacheFlush,
  CacheGet,
  CacheSet,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
  MomentoLogger,
  MomentoLoggerFactory,
} from '@gomomento/sdk';
import {createCache, getCacheClient} from './utils/cache';
import {PerfTestOptions} from './utils/perf-test-options';
import {calculateSummary, getElapsedMillis, RequestType} from './utils/perf-test-utils';

class PerfTest {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly logger: MomentoLogger;
  private readonly cacheItemTtlSeconds = 600;
  private readonly options: PerfTestOptions;

  private readonly cacheName: string = 'js-perf-test';
  private completionTimes: number[] = [];

  constructor(options: PerfTestOptions) {
    this.loggerFactory = options.loggerFactory;
    this.logger = this.loggerFactory.getLogger('get-set-batch-perf-test');
    this.options = options;
  }

  async run(): Promise<void> {
    const momento = await getCacheClient(
      this.options.loggerFactory,
      this.options.requestTimeoutMs,
      this.cacheItemTtlSeconds
    );
    await createCache(momento, this.cacheName, this.logger);

    this.logger.info(
      `Running get/set async and batch performance test with ${this.options.batchSize} items per batch and ${this.options.itemSizeBytesInMb} MB item size for ${this.options.numberOfBatches} batches.`
    );

    // For number of batches, send async set requests
    for (let i = 0; i < this.options.numberOfBatches; i++) {
      const startKey = i * this.options.batchSize;
      const endKey = startKey + this.options.batchSize;
      await this.runAsyncSetTests(momento, startKey, endKey);
    }

    // Send set batch requests
    await this.runSetBatchTests(momento);

    // Send get batch requests
    await this.runAsyncGetTests(momento);

    // Send get batch requests
    await this.runGetBatchTests(momento);

    // Clean up
    const res = await momento.flushCache(this.cacheName);
    if (res instanceof CacheFlush.Success) {
      this.logger.info('Cache flushed successfully');
    } else {
      this.logger.error(`Failed to flush cache: ${res.toString()}`);
    }
    // await momento.deleteCache(cacheName);
  }

  private async runAsyncSetTests(momento: CacheClient, startKey: number, endKey: number): Promise<void> {
    const setPromises: Promise<CacheSet.Response>[] = [];
    const setStartTime = process.hrtime();
    for (let i = startKey; i < endKey; i++) {
      const key = `key-${i}`;
      const value = 'x'.repeat(this.options.itemSizeBytesInMb * 1024 * 1024); // Convert MB to bytes
      const setPromise = this.asyncSet(momento, key, value);
      setPromises.push(setPromise);
    }
    await Promise.all(setPromises);
    const asyncSetElapsedMillis = getElapsedMillis(setStartTime);
    if (startKey === 0) {
      calculateSummary(
        this.completionTimes,
        asyncSetElapsedMillis,
        this.options.batchSize,
        this.options.batchSize * this.options.itemSizeBytesInMb,
        this.logger,
        RequestType.ASYNC_SETS
      );
      this.completionTimes.length = 0; // Clear completion times for next tests
    }
  }

  private async runAsyncGetTests(momento: CacheClient): Promise<void> {
    const getPromises: Promise<CacheGet.Response>[] = [];
    const totalKeys = this.options.batchSize * this.options.numberOfBatches;
    const getStartTime = process.hrtime();
    for (let i = 0; i < totalKeys; i++) {
      const key = `key-${i}`;
      const getPromise = this.asyncGet(momento, key);
      getPromises.push(getPromise);
    }
    await Promise.all(getPromises);
    const asyncGetElapsedMillis = getElapsedMillis(getStartTime);
    calculateSummary(
      this.completionTimes,
      asyncGetElapsedMillis,
      totalKeys,
      this.options.batchSize * this.options.itemSizeBytesInMb * this.options.numberOfBatches,
      this.logger,
      RequestType.ASYNC_GETS
    );
    this.completionTimes.length = 0; // Clear completion times for next tests
  }

  private async runGetBatchTests(momento: CacheClient): Promise<void> {
    const keys = Array.from({length: this.options.batchSize * this.options.numberOfBatches}, (_, i) => `key-${i}`);
    const getBatchStartTime = process.hrtime();
    const getBatchPromise = momento.getBatch(this.cacheName, keys);
    await getBatchPromise;
    const getBatchElapsedMillis = getElapsedMillis(getBatchStartTime);
    calculateSummary(
      this.completionTimes,
      getBatchElapsedMillis,
      this.options.batchSize * this.options.numberOfBatches,
      this.options.batchSize * this.options.itemSizeBytesInMb * this.options.numberOfBatches,
      this.logger,
      RequestType.GET_BATCH
    );
    this.completionTimes.length = 0; // Clear completion times for next tests
  }

  private async runSetBatchTests(momento: CacheClient): Promise<void> {
    const keys = Array.from({length: this.options.batchSize}, (_, i) => `key-${i}`);
    const values = Array.from({length: this.options.batchSize}, () =>
      'x'.repeat(this.options.itemSizeBytesInMb * 1024 * 1024)
    );
    const items = new Map<string, string>();
    keys.forEach((key, index) => {
      items.set(key, values[index]);
    });
    const setBatchStartTime = process.hrtime();
    const setBatchPromise = momento.setBatch(this.cacheName, items);
    await setBatchPromise;
    const setBatchElapsedMillis = getElapsedMillis(setBatchStartTime);
    calculateSummary(
      this.completionTimes,
      setBatchElapsedMillis,
      this.options.batchSize,
      this.options.batchSize * this.options.itemSizeBytesInMb,
      this.logger,
      RequestType.SET_BATCH
    );
    this.completionTimes.length = 0; // Clear completion times for next tests
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

  private asyncGet(momento: CacheClient, key: string): Promise<CacheGet.Response> {
    const startTime = process.hrtime();
    const getPromise = momento.get(this.cacheName, key);
    void getPromise.then(() => {
      const elapsedMillis = getElapsedMillis(startTime);
      this.completionTimes.push(elapsedMillis);
    });
    return getPromise;
  }
}

async function main(perfTestOptions: PerfTestOptions) {
  const perfTest = new PerfTest(perfTestOptions);
  await perfTest.run();
  console.log('success!!');
}

// We have a constraint where the total request size should not exceed 5MB.
// This means we can explore combinations of batch sizes and item sizes, ensuring they collectively sum up to 5MB for testing purposes.
const perfTestOptions: PerfTestOptions = {
  loggerFactory: new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.DEBUG),
  batchSize: 5,
  numberOfBatches: 1,
  itemSizeBytesInMb: 1,
  requestTimeoutMs: 600000, // 10 minutes to avoid hitting TimeoutError from grpc
};

main(perfTestOptions).catch((e: Error) => {
  console.error(`Uncaught exception while running load gen: ${e.message}`);
  throw e;
});
