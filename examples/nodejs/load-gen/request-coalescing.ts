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
} from './utils/load-gen';
import {getElapsedMillis, logCoalescingStats, logStats} from './utils/load-gen-statistics-calculator';
import {createCache, getCacheClient} from './utils/cache';
import {GetAndSetOnlyClient, MomentoClientWrapperWithCoalescing} from './utils/momento-client-with-coalescing';

const cacheKeys: string[] = [];

for (let i = 0; i < 10; i++) {
  cacheKeys.push(`cacheKey${i}`);
}

class RequestCoalescerLoadGen {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly logger: MomentoLogger;
  private readonly cacheItemTtlSeconds = 60;
  private readonly options: BasicLoadGenOptions;
  private readonly delayMillisBetweenRequests: number;
  private readonly cacheValue: string;

  private readonly cacheName: string = 'js-requestcoalescer';

  constructor(options: BasicLoadGenOptions) {
    this.loggerFactory = options.loggerFactory;
    this.logger = this.loggerFactory.getLogger('request-coalescer-load-gen');
    this.options = options;
    this.cacheValue = 'x'.repeat(options.cacheItemPayloadBytes);
    this.delayMillisBetweenRequests =
      (1000.0 * this.options.numberOfConcurrentRequests) / this.options.maxRequestsPerSecond;
  }

  async run(): Promise<void> {
    const momento = await getCacheClient(this.loggerFactory, this.options.requestTimeoutMs, this.cacheItemTtlSeconds);

    await createCache(momento, this.cacheName, this.logger);

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

  private async launchAndRunWorkers(client: GetAndSetOnlyClient, loadGenContext: BasicLoadGenContext): Promise<void> {
    let finished = false;
    const finish = () => (finished = true);
    setTimeout(finish, this.options.totalSecondsToRun * 1000);

    for (;;) {
      await this.issueAsyncSetGet(client, loadGenContext);
      if (finished) {
        return;
      }
    }
  }

  private async issueAsyncSetGet(client: GetAndSetOnlyClient, loadGenContext: BasicLoadGenContext): Promise<void> {
    const cacheKey = this.getRandomCacheKey();

    const setStartTime = process.hrtime();
    const result = await executeRequestAndUpdateContextCounts(this.logger, loadGenContext, () =>
      client.set(this.cacheName, cacheKey, this.cacheValue)
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
      client.get(this.cacheName, cacheKey)
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

  private getRandomCacheKey(): string {
    return cacheKeys[Math.floor(Math.random() * cacheKeys.length)];
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
   * Controls the size of the payload that will be used for the cache items in
   * the load test.  Smaller payloads will generally provide lower latencies than
   * larger payloads.
   */
  cacheItemPayloadBytes: 100,
  /**
   * Sets an upper bound on how many requests per second will be sent to the server.
   * Momento caches have a default throttling limit of 100 requests per second,
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
