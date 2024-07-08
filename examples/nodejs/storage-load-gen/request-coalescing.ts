import {
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
  MomentoLogger,
  MomentoLoggerFactory,
} from '@gomomento/sdk';
import {range} from './utils/collections';
import {delay} from './utils/time';
import {
  BasicLoadGenContext,
  BasicLoadGenOptions,
  executeRequestAndUpdateContextCounts,
  initiateLoadGenContext,
  initiateRequestCoalescerContext,
  LoadGenOperations,
} from './utils/load-gen';
import {getElapsedMillis, logCoalescingStats, logStats} from './utils/load-gen-statistics-calculator';
import {createStore, getStorageClient} from './utils/store';
import {GetAndPutOnlyClient, MomentoClientWrapperWithCoalescing} from './utils/momento-client-with-coalescing';

const keys: string[] = [];

for (let i = 0; i < 10; i++) {
  keys.push(`key${i}`);
}

class RequestCoalescerLoadGen {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly logger: MomentoLogger;
  private readonly options: BasicLoadGenOptions;
  private readonly delayMillisBetweenRequests: number;
  private readonly value: string;

  private readonly storeName: string = 'js-requestcoalescer';

  constructor(options: BasicLoadGenOptions) {
    this.loggerFactory = options.loggerFactory;
    this.logger = this.loggerFactory.getLogger('request-coalescer-load-gen');
    this.options = options;
    this.value = 'x'.repeat(options.storeItemPayloadBytes);
    this.delayMillisBetweenRequests =
      (1000.0 * this.options.numberOfConcurrentRequests) / this.options.maxRequestsPerSecond;
  }

  async run(): Promise<void> {
    const momento = getStorageClient(this.loggerFactory, this.options.requestTimeoutMs);

    await createStore(momento, this.storeName, this.logger);

    this.logger.trace(`delayMillisBetweenRequests: ${this.delayMillisBetweenRequests}`);

    this.logger.info(`Limiting to ${this.options.maxRequestsPerSecond} tps`);
    this.logger.info(`Running ${this.options.numberOfConcurrentRequests} concurrent requests`);
    this.logger.info(`Running for ${this.options.totalSecondsToRun} seconds`);

    console.log('------------ PROCESSING REQUESTS WITHOUT REQUEST COALESCING ------------');

    let loadGenContext = initiateLoadGenContext();
    // Show stats periodically.
    let logStatsIntervalId = setInterval(() => {
      logStats(loadGenContext, this.logger, this.options.maxRequestsPerSecond);
    }, this.options.showStatsIntervalSeconds * 1000);

    const asyncGetSetResults = range(this.options.numberOfConcurrentRequests).map(() =>
      this.launchAndRunWorkers(momento, loadGenContext)
    );

    await Promise.all(asyncGetSetResults);

    // We're done, stop showing stats.
    clearInterval(logStatsIntervalId);

    // Show the stats one last time at the end.
    logStats(loadGenContext, this.logger, this.options.maxRequestsPerSecond);

    this.logger.info('DONE!');
    // wait a few millis to allow the logger to finish flushing
    await delay(500);

    console.log('------------ PROCESSING REQUESTS WITH REQUEST COALESCING ------------');

    loadGenContext = initiateLoadGenContext();

    // Show stats periodically.
    logStatsIntervalId = setInterval(() => {
      logStats(loadGenContext, this.logger, this.options.maxRequestsPerSecond);
      logCoalescingStats(requestCoalescerContext, loadGenContext, this.logger);
    }, this.options.showStatsIntervalSeconds * 1000);

    const requestCoalescerContext = initiateRequestCoalescerContext();

    const momentoWithCoalescing = new MomentoClientWrapperWithCoalescing(momento, requestCoalescerContext);

    const asyncGetSetResultsWithRequestCoalescer = range(this.options.numberOfConcurrentRequests).map(() =>
      this.launchAndRunWorkers(momentoWithCoalescing, loadGenContext)
    );

    await Promise.all(asyncGetSetResultsWithRequestCoalescer);

    // We're done, stop showing stats.
    clearInterval(logStatsIntervalId);

    // Show the stats one last time at the end.
    logStats(loadGenContext, this.logger, this.options.maxRequestsPerSecond);
    logCoalescingStats(requestCoalescerContext, loadGenContext, this.logger);

    this.logger.info('DONE!');
    // wait a few millis to allow the logger to finish flushing
    await delay(500);
  }

  private async launchAndRunWorkers(client: GetAndPutOnlyClient, loadGenContext: BasicLoadGenContext): Promise<void> {
    let finished = false;
    const finish = () => (finished = true);
    setTimeout(finish, this.options.totalSecondsToRun * 1000);

    for (;;) {
      switch (this.options.loadGenOperations) {
        case LoadGenOperations.GET: {
          await this.issueAsyncGet(client, loadGenContext);
          break;
        }
        case LoadGenOperations.PUT: {
          await this.issueAsyncPut(client, loadGenContext);
          break;
        }
        case LoadGenOperations.GET_AND_PUT: {
          await this.issueAsyncPutGet(client, loadGenContext);
          break;
        }
      }
      if (finished) {
        return;
      }
    }
  }

  private async issueAsyncPutGet(client: GetAndPutOnlyClient, loadGenContext: BasicLoadGenContext): Promise<void> {
    const key = this.getRandomKey();

    const setStartTime = process.hrtime();
    const result = await executeRequestAndUpdateContextCounts(this.logger, loadGenContext, () =>
      client.putString(this.storeName, key, this.value)
    );
    if (result !== undefined) {
      const setDuration = getElapsedMillis(setStartTime);
      loadGenContext.setLatencies.recordValue(setDuration);
      if (setDuration < this.delayMillisBetweenRequests) {
        const delayMs = this.delayMillisBetweenRequests - setDuration;
        this.logger.trace(`delaying: ${delayMs}`);
        await delay(delayMs);
      }
    }

    const getStartTime = process.hrtime();
    const getResult = await executeRequestAndUpdateContextCounts(this.logger, loadGenContext, () =>
      client.get(this.storeName, key)
    );

    if (getResult !== undefined) {
      const getDuration = getElapsedMillis(getStartTime);
      loadGenContext.getLatencies.recordValue(getDuration);
      if (getDuration < this.delayMillisBetweenRequests) {
        const delayMs = this.delayMillisBetweenRequests - getDuration;
        this.logger.trace(`delaying: ${delayMs}`);
        await delay(delayMs);
      }
    }
  }

  private async issueAsyncPut(client: GetAndPutOnlyClient, loadGenContext: BasicLoadGenContext): Promise<void> {
    const key = this.getRandomKey();

    const setStartTime = process.hrtime();
    const result = await executeRequestAndUpdateContextCounts(this.logger, loadGenContext, () =>
      client.putString(this.storeName, key, this.value)
    );
    if (result !== undefined) {
      const setDuration = getElapsedMillis(setStartTime);
      loadGenContext.setLatencies.recordValue(setDuration);
      if (setDuration < this.delayMillisBetweenRequests) {
        const delayMs = this.delayMillisBetweenRequests - setDuration;
        this.logger.trace(`delaying: ${delayMs}`);
        await delay(delayMs);
      }
    }
  }

  private async issueAsyncGet(client: GetAndPutOnlyClient, loadGenContext: BasicLoadGenContext): Promise<void> {
    const key = this.getRandomKey();

    const getStartTime = process.hrtime();
    const getResult = await executeRequestAndUpdateContextCounts(this.logger, loadGenContext, () =>
      client.get(this.storeName, key)
    );

    if (getResult !== undefined) {
      const getDuration = getElapsedMillis(getStartTime);
      loadGenContext.getLatencies.recordValue(getDuration);
      if (getDuration < this.delayMillisBetweenRequests) {
        const delayMs = this.delayMillisBetweenRequests - getDuration;
        this.logger.trace(`delaying: ${delayMs}`);
        await delay(delayMs);
      }
    }
  }

  private getRandomKey(): string {
    return keys[Math.floor(Math.random() * keys.length)];
  }
}

const loadGeneratorOptions: BasicLoadGenOptions = {
  /**
   * This setting allows you to control the verbosity of the log output during
   * the load generator run.
   */
  loggerFactory: new DefaultMomentoLoggerFactory(
    /**
     * Available log levels are trace, debug, info, warn, and error.
     */
    DefaultMomentoLoggerLevel.DEBUG
  ),
  /** Print some statistics about throughput and latency every time this many
   *  seconds have passed.
   */
  showStatsIntervalSeconds: 5,
  /**
   * Configures the Momento client to timeout if a request exceeds this limit.
   * Momento client default is 5 seconds.
   */
  requestTimeoutMs: 15 * 1000,
  /**
   * Controls the size of the payload that will be used for the store items in
   * the load test.  Smaller payloads will generally provide lower latencies than
   * larger payloads.
   */
  storeItemPayloadBytes: 100,
  /**
   * Sets an upper bound on how many requests per second will be sent to the server.
   * Momento stores have a default throttling limit of 100 requests per second,
   * so if you raise this, you may observe throttled requests.  Contact
   * support@momentohq.com to inquire about raising your limits.
   */
  maxRequestsPerSecond: 100,
  /**
   * Controls the number of concurrent requests that will be made (via asynchronous
   * function calls) by the load test.  Increasing this number may improve throughput,
   * but it will also increase CPU consumption.  As CPU usage increases and there
   * is more contention between the concurrent function calls, client-side latencies
   * may increase.
   *
   * **Note**: You are likely to see degraded performance if you increase this above 50
   * and observe elevated client-side latencies.
   */
  numberOfConcurrentRequests: 10,
  /**
   * Controls how long the load test will run, in milliseconds. We will execute operations
   * for this long and the exit.
   */
  totalSecondsToRun: 60,
  /**
   * Controls whether the load generator will make GET, PUT, or both GET and PUT requests.
   */
  loadGenOperations: LoadGenOperations.GET_AND_PUT,
};

async function main(loadGeneratorOptions: BasicLoadGenOptions) {
  const loadGenerator = new RequestCoalescerLoadGen(loadGeneratorOptions);
  await loadGenerator.run();
}

main(loadGeneratorOptions)
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running load gen: ${e.message}`);
    throw e;
  });
