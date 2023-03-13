import {
  CacheClient, CacheGet, CacheSet, Configurations, CreateCache,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel, EnvMomentoTokenProvider, InternalServerError, LimitExceededError,
  MomentoLogger,
  MomentoLoggerFactory, TimeoutError
} from "@gomomento/sdk";
import {range} from "./utils/collections";
import * as hdr from "hdr-histogram-js";
import {delay} from "./utils/time";

let cacheKeys = ["cacheKey0", "cacheKey1", "cacheKey2", "cacheKey3", "cacheKey4",
  "cacheKey5", "cacheKey6", "cacheKey7", "cacheKey8", "cacheKey9"];

let requestCoalescerMap = new Map<string, Promise<CacheGet.Response>>();

interface RequestCoalescerLoadGenOptions {
  loggerFactory: MomentoLoggerFactory;
  requestTimeoutMs: number;
  cacheItemPayloadBytes: number;
  numberOfConcurrentRequests: number;
  showStatsIntervalSeconds: number;
  maxRequestsPerSecond: number;
  totalSecondsToRun: number;
}

enum AsyncSetGetResult {
  SUCCESS = 'SUCCESS',
  UNAVAILABLE = 'UNAVAILABLE',
  DEADLINE_EXCEEDED = 'DEADLINE_EXCEEDED',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  RST_STREAM = 'RST_STREAM',
}

interface RequestCoalescerLoadGenContext {
  startTime: [number, number];
  getLatencies: hdr.Histogram;
  setLatencies: hdr.Histogram;
  globalRequestCount: number;
  globalSuccessCount: number;
  globalUnavailableCount: number;
  globalDeadlineExceededCount: number;
  globalResourceExhaustedCount: number;
  globalRstStreamCount: number;
}

class RequestCoalescerLoadGen {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly logger: MomentoLogger;
  private readonly cacheItemTtlSeconds = 60;
  private readonly options: RequestCoalescerLoadGenOptions;
  private readonly delayMillisBetweenRequests: number;
  private readonly cacheValue: string;

  private readonly cacheName: string = 'js-requestCoalescerLoadGen';

  constructor(options: RequestCoalescerLoadGenOptions) {
    this.loggerFactory = options.loggerFactory;
    this.logger = this.loggerFactory.getLogger('request-coalescer-load-gen');
    this.options = options;
    this.cacheValue = 'x'.repeat(options.cacheItemPayloadBytes);
    this.delayMillisBetweenRequests =
      (1000.0 * this.options.numberOfConcurrentRequests) /
      this.options.maxRequestsPerSecond;
  }

  async run(): Promise<void> {
    const momento = new CacheClient({
      configuration: Configurations.Laptop.v1(
        this.loggerFactory
      ).withClientTimeoutMillis(this.options.requestTimeoutMs),
      credentialProvider: new EnvMomentoTokenProvider({
        environmentVariableName: 'MOMENTO_AUTH_TOKEN',
      }),
      defaultTtlSeconds: this.cacheItemTtlSeconds,
    });

    const createResponse = await momento.createCache(this.cacheName);
    if (createResponse instanceof CreateCache.AlreadyExists) {
      this.logger.info(`cache '${this.cacheName}' already exists`);
    } else if (createResponse instanceof CreateCache.Error) {
      throw createResponse.innerException();
    }

    this.logger.trace(
      `delayMillisBetweenRequests: ${this.delayMillisBetweenRequests}`
    );

    this.logger.info(`Limiting to ${this.options.maxRequestsPerSecond} tps`);
    this.logger.info(
      `Running ${this.options.numberOfConcurrentRequests} concurrent requests`
    );
    this.logger.info(`Running for ${this.options.totalSecondsToRun} seconds`);

    const loadGenContext: RequestCoalescerLoadGenContext = {
      startTime: process.hrtime(),
      getLatencies: hdr.build(),
      setLatencies: hdr.build(),
      globalRequestCount: 0,
      globalSuccessCount: 0,
      globalUnavailableCount: 0,
      globalDeadlineExceededCount: 0,
      globalResourceExhaustedCount: 0,
      globalRstStreamCount: 0,
    };

    console.log("------------ PROCESSING REQUESTS WITHOUT REQUEST COALESCING ------------")
    const asyncGetSetResults = range(
      this.options.numberOfConcurrentRequests
    ).map(_ =>
      this.launchAndRunWorkersWithoutRequestCoalescer(momento, loadGenContext)
    );

    console.log("------------ PROCESSING REQUESTS WITH REQUEST COALESCING ------------")
    const asyncGetSetResultsWithRequestCoalescer = range(
      this.options.numberOfConcurrentRequests
    ).map(_ =>
      this.launchAndRunWorkersWithRequestCoalescer(momento, loadGenContext)
    );

    // Show stats periodically.
    const logStatsIntervalId = setInterval(() => {
      this.logStats(loadGenContext);
    }, this.options.showStatsIntervalSeconds * 1000);

    await Promise.all(asyncGetSetResults);

    // We're done, stop showing stats.
    clearInterval(logStatsIntervalId);

    // Show the stats one last time at the end.
    this.logStats(loadGenContext);

    this.logger.info('DONE!');
    // wait a few millis to allow the logger to finish flushing
    await delay(500);
  }
  private async launchAndRunWorkersWithoutRequestCoalescer(
    client: CacheClient,
    loadGenContext: RequestCoalescerLoadGenContext
  ): Promise<void> {
    let finished = false;
    const finish = () => (finished = true);
    setTimeout(finish, this.options.totalSecondsToRun * 1000);

    let i = 1;
    for (;;) {
      await this.issueAsyncSetGet(client, loadGenContext);

      if (finished) {
        return;
      }
      i++;
    }
  }

  private async launchAndRunWorkersWithRequestCoalescer(
    client: CacheClient,
    loadGenContext: RequestCoalescerLoadGenContext
  ): Promise<void> {
    let finished = false;
    const finish = () => (finished = true);
    setTimeout(finish, this.options.totalSecondsToRun * 1000);

    let i = 1;
    for (;;) {
      this.issueAsyncSetGetWithRequestCoalescer(client, loadGenContext);

      // create a callback function that takes in the promise and removes the key/value pair from map when the promise is resolved

      if (finished) {
        return;
      }
      i++;
    }
  }
  private async issueAsyncSetGet(
    client: CacheClient,
    loadGenContext: RequestCoalescerLoadGenContext
  ): Promise<void> {

    // pick random key from cacheKeys
    const cacheKey = cacheKeys[Math.floor(Math.random() * cacheKeys.length)];

    const setStartTime = process.hrtime();
    const result = await this.executeRequestAndUpdateContextCounts(
      loadGenContext,
      () => client.set(this.cacheName, cacheKey, this.cacheValue)
    );
    if (result !== undefined) {
      const setDuration = RequestCoalescerLoadGen.getElapsedMillis(setStartTime);
      loadGenContext.setLatencies.recordValue(setDuration);
      if (setDuration < this.delayMillisBetweenRequests) {
        const delayMs = this.delayMillisBetweenRequests - setDuration;
        this.logger.trace(`delaying: ${delayMs}`);
        await delay(delayMs);
      }
    }

    const getStartTime = process.hrtime();
    const getResult = await this.executeRequestAndUpdateContextCounts(
      loadGenContext,
      () => client.get(this.cacheName, cacheKey)
    );

    if (getResult !== undefined) {
      const getDuration = RequestCoalescerLoadGen.getElapsedMillis(getStartTime);
      loadGenContext.getLatencies.recordValue(getDuration);
      if (getDuration < this.delayMillisBetweenRequests) {
        const delayMs = this.delayMillisBetweenRequests - getDuration;
        this.logger.trace(`delaying: ${delayMs}`);
        await delay(delayMs);
      }
    }
  }

  private async issueAsyncSetGetWithRequestCoalescer<T>(
    client: CacheClient,
    loadGenContext: RequestCoalescerLoadGenContext
  ): Promise<CacheGet.Response | undefined> {
    const cacheKey = cacheKeys[Math.floor(Math.random() * cacheKeys.length)];

    const getStartTime = process.hrtime();
    if (requestCoalescerMap.has(cacheKey)) {
      return requestCoalescerMap.get(cacheKey)!
    } else {
      // Issue Momento get request and set the key/value in map
      const getResultPromise = client.get(this.cacheName, cacheKey)
      requestCoalescerMap.set(cacheKey, getResultPromise)

      if (getResultPromise !== undefined) {
        const getDuration = RequestCoalescerLoadGen.getElapsedMillis(getStartTime);
        loadGenContext.getLatencies.recordValue(getDuration);
        if (getDuration < this.delayMillisBetweenRequests) {
          const delayMs = this.delayMillisBetweenRequests - getDuration;
          this.logger.trace(`delaying: ${delayMs}`);
          await delay(delayMs);
        }
      }
      return getResultPromise
    }

  }

  private logStats(loadGenContext: RequestCoalescerLoadGenContext): void {
    this.logger.info(`
cumulative stats:
total requests: ${loadGenContext.globalRequestCount} (${RequestCoalescerLoadGen.tps(
      loadGenContext,
      loadGenContext.globalRequestCount
    )} tps, limited to ${this.options.maxRequestsPerSecond} tps)
       success: ${
      loadGenContext.globalSuccessCount
    } (${RequestCoalescerLoadGen.percentRequests(
      loadGenContext,
      loadGenContext.globalSuccessCount
    )}%) (${RequestCoalescerLoadGen.tps(
      loadGenContext,
      loadGenContext.globalSuccessCount
    )} tps)
   unavailable: ${
      loadGenContext.globalUnavailableCount
    } (${RequestCoalescerLoadGen.percentRequests(
      loadGenContext,
      loadGenContext.globalUnavailableCount
    )}%)
deadline exceeded: ${
      loadGenContext.globalDeadlineExceededCount
    } (${RequestCoalescerLoadGen.percentRequests(
      loadGenContext,
      loadGenContext.globalDeadlineExceededCount
    )}%)
resource exhausted: ${
      loadGenContext.globalResourceExhaustedCount
    } (${RequestCoalescerLoadGen.percentRequests(
      loadGenContext,
      loadGenContext.globalResourceExhaustedCount
    )}%)
    rst stream: ${
      loadGenContext.globalRstStreamCount
    } (${RequestCoalescerLoadGen.percentRequests(
      loadGenContext,
      loadGenContext.globalRstStreamCount
    )}%)

cumulative set latencies:
${RequestCoalescerLoadGen.outputHistogramSummary(loadGenContext.setLatencies)}

cumulative get latencies:
${RequestCoalescerLoadGen.outputHistogramSummary(loadGenContext.getLatencies)}
`);
  }

  private static tps(
    context: RequestCoalescerLoadGenContext,
    requestCount: number
  ): number {
    return Math.round(
      (requestCount * 1000) / RequestCoalescerLoadGen.getElapsedMillis(context.startTime)
    );
  }

  private static percentRequests(
    context: RequestCoalescerLoadGenContext,
    count: number
  ): string {
    return (
      Math.round((count / context.globalRequestCount) * 100 * 10) / 10
    ).toString();
  }

  private static outputHistogramSummary(histogram: hdr.Histogram): string {
    return `
  count: ${histogram.totalCount}
    min: ${histogram.minNonZeroValue}
    p50: ${histogram.getValueAtPercentile(50)}
    p90: ${histogram.getValueAtPercentile(90)}
    p99: ${histogram.getValueAtPercentile(99)}
  p99.9: ${histogram.getValueAtPercentile(99.9)}
    max: ${histogram.maxValue}
`;
  }

  private async executeRequestAndUpdateContextCounts<T>(
    context: RequestCoalescerLoadGenContext,
    block: () => Promise<T>
  ): Promise<T | undefined> {
    const [result, response] = await this.executeRequest(block);
    this.updateContextCountsForRequest(context, result);
    return response;
  }

  private async executeRequest<T>(
    block: () => Promise<T>
  ): Promise<[AsyncSetGetResult, T | undefined]> {
    try {
      const result = await block();
      if (
        result instanceof CacheSet.Error ||
        result instanceof CacheGet.Error
      ) {
        throw result.innerException();
      }
      return [AsyncSetGetResult.SUCCESS, result];
    } catch (e) {
      if (e instanceof InternalServerError) {
        if (e.message.includes('UNAVAILABLE')) {
          return [AsyncSetGetResult.UNAVAILABLE, undefined];
        } else if (e.message.includes('RST_STREAM')) {
          this.logger.error(
            `Caught RST_STREAM error; swallowing: ${e.name}, ${e.message}`
          );
          return [AsyncSetGetResult.RST_STREAM, undefined];
        } else {
          throw e;
        }
      } else if (e instanceof LimitExceededError) {
        if (e.message.includes('RESOURCE_EXHAUSTED')) {
          this.logger.error(
            `Caught RESOURCE_EXHAUSTED error; swallowing: ${e.name}, ${e.message}`
          );
          return [AsyncSetGetResult.RESOURCE_EXHAUSTED, undefined];
        } else {
          throw e;
        }
      } else if (e instanceof TimeoutError) {
        if (e.message.includes('DEADLINE_EXCEEDED')) {
          return [AsyncSetGetResult.DEADLINE_EXCEEDED, undefined];
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }
  }

  // private async executeRequestWithRequestCoalescer(
  //   block: () => Promise<Response>
  // ): Promise<[AsyncSetGetResult, Promise<Response>]> {
  //   const result = block();
  //   return [AsyncSetGetResult.SUCCESS, result];
  // }

  private updateContextCountsForRequest(
    context: RequestCoalescerLoadGenContext,
    result: AsyncSetGetResult
  ): void {
    context.globalRequestCount++;
    // TODO: this could be simplified and made more generic, worth doing if we ever want to
    //  expand this to additional types of behavior
    switch (result) {
      case AsyncSetGetResult.SUCCESS:
        context.globalSuccessCount++;
        break;
      case AsyncSetGetResult.UNAVAILABLE:
        context.globalUnavailableCount++;
        break;
      case AsyncSetGetResult.DEADLINE_EXCEEDED:
        context.globalDeadlineExceededCount++;
        break;
      case AsyncSetGetResult.RESOURCE_EXHAUSTED:
        context.globalResourceExhaustedCount++;
        break;
      case AsyncSetGetResult.RST_STREAM:
        context.globalRstStreamCount++;
        break;
    }
  }

  private static getElapsedMillis(startTime: [number, number]): number {
    const endTime = process.hrtime(startTime);
    return (endTime[0] * 1e9 + endTime[1]) / 1e6;
  }
}

const loadGeneratorOptions: RequestCoalescerLoadGenOptions = {
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
   */
  numberOfConcurrentRequests: 200,
  /**
   * Controls how long the load test will run, in milliseconds. We will execute operations
   * for this long and the exit.
   */
  totalSecondsToRun: 60,
};

async function main(loadGeneratorOptions: RequestCoalescerLoadGenOptions) {
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

