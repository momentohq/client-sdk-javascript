import {
  getLogger,
  InternalServerError,
  LimitExceededError,
  LogFormat,
  Logger,
  LoggerOptions,
  LogLevel,
  initializeMomentoLogging,
  SimpleCacheClient,
  TimeoutError,
  CreateCache,
  CacheGet,
  CacheSet,
  Configurations,
  EnvMomentoTokenProvider,
} from '@gomomento/sdk';
import * as hdr from 'hdr-histogram-js';
import {range} from './utils/collections';
import {delay} from './utils/time';

interface BasicJavaScriptLoadGenOptions {
  loggerOptions: LoggerOptions;
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

interface BasicJavasScriptLoadGenContext {
  startTime: [number, number];
  getLatencies: hdr.Histogram;
  setLatencies: hdr.Histogram;
  // TODO: these could be generalized into a map structure that
  //  would make it possible to deal with a broader range of
  //  failure types more succinctly.
  globalRequestCount: number;
  globalSuccessCount: number;
  globalUnavailableCount: number;
  globalDeadlineExceededCount: number;
  globalResourceExhaustedCount: number;
  globalRstStreamCount: number;
}

class BasicJavaScriptLoadGen {
  private readonly logger: Logger;
  private readonly cacheItemTtlSeconds = 60;
  private readonly loggerOptions: LoggerOptions;
  private readonly options: BasicJavaScriptLoadGenOptions;
  private readonly delayMillisBetweenRequests: number;
  private readonly cacheValue: string;

  private readonly cacheName: string = 'js-loadgen';

  constructor(options: BasicJavaScriptLoadGenOptions) {
    initializeMomentoLogging(options.loggerOptions);
    this.logger = getLogger('load-gen');
    this.loggerOptions = options.loggerOptions;
    this.options = options;
    this.cacheValue = 'x'.repeat(options.cacheItemPayloadBytes);
    this.delayMillisBetweenRequests =
      (1000.0 * this.options.numberOfConcurrentRequests) /
      this.options.maxRequestsPerSecond;
  }

  async run(): Promise<void> {
    const momento = new SimpleCacheClient({
      configuration: Configurations.Laptop.latest(
        this.loggerOptions
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

    const loadGenContext: BasicJavasScriptLoadGenContext = {
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

    const asyncGetSetResults = range(
      this.options.numberOfConcurrentRequests
    ).map(workerId =>
      this.launchAndRunWorkers(momento, loadGenContext, workerId + 1)
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

  private async launchAndRunWorkers(
    client: SimpleCacheClient,
    loadGenContext: BasicJavasScriptLoadGenContext,
    workerId: number
  ): Promise<void> {
    let finished = false;
    const finish = () => (finished = true);
    setTimeout(finish, this.options.totalSecondsToRun * 1000);

    let i = 1;
    for (;;) {
      await this.issueAsyncSetGet(client, loadGenContext, workerId, i);

      if (finished) {
        return;
      }

      i++;
    }
  }

  private logStats(loadGenContext: BasicJavasScriptLoadGenContext): void {
    this.logger.info(`
cumulative stats:
total requests: ${
      loadGenContext.globalRequestCount
    } (${BasicJavaScriptLoadGen.tps(
      loadGenContext,
      loadGenContext.globalRequestCount
    )} tps, limited to ${this.options.maxRequestsPerSecond} tps)
       success: ${
         loadGenContext.globalSuccessCount
       } (${BasicJavaScriptLoadGen.percentRequests(
      loadGenContext,
      loadGenContext.globalSuccessCount
    )}%) (${BasicJavaScriptLoadGen.tps(
      loadGenContext,
      loadGenContext.globalSuccessCount
    )} tps)
   unavailable: ${
     loadGenContext.globalUnavailableCount
   } (${BasicJavaScriptLoadGen.percentRequests(
      loadGenContext,
      loadGenContext.globalUnavailableCount
    )}%)
deadline exceeded: ${
      loadGenContext.globalDeadlineExceededCount
    } (${BasicJavaScriptLoadGen.percentRequests(
      loadGenContext,
      loadGenContext.globalDeadlineExceededCount
    )}%)
resource exhausted: ${
      loadGenContext.globalResourceExhaustedCount
    } (${BasicJavaScriptLoadGen.percentRequests(
      loadGenContext,
      loadGenContext.globalResourceExhaustedCount
    )}%)
    rst stream: ${
      loadGenContext.globalRstStreamCount
    } (${BasicJavaScriptLoadGen.percentRequests(
      loadGenContext,
      loadGenContext.globalRstStreamCount
    )}%)

cumulative set latencies:
${BasicJavaScriptLoadGen.outputHistogramSummary(loadGenContext.setLatencies)}

cumulative get latencies:
${BasicJavaScriptLoadGen.outputHistogramSummary(loadGenContext.getLatencies)}
`);
  }

  private async issueAsyncSetGet(
    client: SimpleCacheClient,
    loadGenContext: BasicJavasScriptLoadGenContext,
    workerId: number,
    operationId: number
  ): Promise<void> {
    const cacheKey = `worker${workerId}operation${operationId}`;

    const setStartTime = process.hrtime();
    const result = await this.executeRequestAndUpdateContextCounts(
      loadGenContext,
      () => client.set(this.cacheName, cacheKey, this.cacheValue)
    );
    if (result !== undefined) {
      const setDuration = BasicJavaScriptLoadGen.getElapsedMillis(setStartTime);
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
      const getDuration = BasicJavaScriptLoadGen.getElapsedMillis(getStartTime);
      loadGenContext.getLatencies.recordValue(getDuration);
      if (getDuration < this.delayMillisBetweenRequests) {
        const delayMs = this.delayMillisBetweenRequests - getDuration;
        this.logger.trace(`delaying: ${delayMs}`);
        await delay(delayMs);
      }
    }
  }

  private async executeRequestAndUpdateContextCounts<T>(
    context: BasicJavasScriptLoadGenContext,
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

  private updateContextCountsForRequest(
    context: BasicJavasScriptLoadGenContext,
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

  private static tps(
    context: BasicJavasScriptLoadGenContext,
    requestCount: number
  ): number {
    return Math.round(
      (requestCount * 1000) /
        BasicJavaScriptLoadGen.getElapsedMillis(context.startTime)
    );
  }

  private static percentRequests(
    context: BasicJavasScriptLoadGenContext,
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

  private static getElapsedMillis(startTime: [number, number]): number {
    const endTime = process.hrtime(startTime);
    return (endTime[0] * 1e9 + endTime[1]) / 1e6;
  }
}

const PERFORMANCE_INFORMATION_MESSAGE = `
Thanks for trying out our basic javascript load generator!  This tool is
included to allow you to experiment with performance in your environment
based on different configurations.  It's very simplistic, and only intended
to give you a quick way to explore the performance of the Momento client
running on a single nodejs process.

Note that because nodejs javascript code runs on a single thread, the limiting
factor in request throughput will often be CPU.  Keep an eye on your CPU
consumption while running the load generator, and if you reach 100%
of a CPU core then you most likely won't be able to improve throughput further
without running additional nodejs processes.

CPU will also impact your client-side latency; as you increase the number of
concurrent requests, if they are competing for CPU time then the observed
latency will increase.

Also, since performance will be impacted by network latency, you'll get the best
results if you run on a cloud VM in the same region as your Momento cache.

Check out the configuration settings at the bottom of the 'load-gen.ts' to
see how different configurations impact performance.

If you have questions or need help experimenting further, please reach out to us!
`;

async function main(loadGeneratorOptions: BasicJavaScriptLoadGenOptions) {
  const loadGenerator = new BasicJavaScriptLoadGen(loadGeneratorOptions);
  await loadGenerator.run();
}

const loadGeneratorOptions: BasicJavaScriptLoadGenOptions = {
  /**
   * This setting allows you to control the verbosity of the log output during
   * the load generator run.
   */
  loggerOptions: {
    /**
     * Available log levels are TRACE, DEBUG, INFO, WARN, and ERROR.  INFO
     * is a reasonable choice for this load generator program.
     */
    level: LogLevel.DEBUG,
    /**
     * Allows you to choose between formatting your log output as JSON (a good
     * choice for production environments) or CONSOLE (a better choice for
     * development environments).
     */
    format: LogFormat.CONSOLE,
  },
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
  numberOfConcurrentRequests: 10,
  /**
   * Controls how long the load test will run, in milliseconds. We will execute operations
   * for this long and the exit.
   */
  totalSecondsToRun: 60,
};

main(loadGeneratorOptions)
  .then(() => {
    console.log('success!!');
    console.log(PERFORMANCE_INFORMATION_MESSAGE);
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running load gen: ${e.message}`);
    throw e;
  });
