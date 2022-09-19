import {
  AlreadyExistsError,
  CacheGetStatus,
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
} from '@gomomento/sdk';
import * as hdr from 'hdr-histogram-js';
import {range} from './utils/collections';
import {delay} from './utils/time';

interface BasicJavaScriptLoadGenOptions {
  loggerOptions: LoggerOptions;
  requestTimeoutMs: number;
  cacheItemPayloadBytes: number;
  numberOfConcurrentRequests: number;
  totalNumberOfOperationsToExecute: number;
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
  private readonly authToken: string;
  private readonly loggerOptions: LoggerOptions;
  private readonly requestTimeoutMs: number;
  private readonly numberOfConcurrentRequests: number;
  private readonly totalNumberOfOperationsToExecute: number;
  private readonly cacheValue: string;

  private readonly cacheName: string = 'js-loadgen';

  constructor(options: BasicJavaScriptLoadGenOptions) {
    initializeMomentoLogging(options.loggerOptions);
    this.logger = getLogger('load-gen');
    const authToken = process.env.MOMENTO_AUTH_TOKEN;
    if (!authToken) {
      throw new Error(
        'Missing required environment variable MOMENTO_AUTH_TOKEN'
      );
    }
    this.loggerOptions = options.loggerOptions;
    this.authToken = authToken;
    this.requestTimeoutMs = options.requestTimeoutMs;
    this.numberOfConcurrentRequests = options.numberOfConcurrentRequests;
    this.totalNumberOfOperationsToExecute =
      options.totalNumberOfOperationsToExecute;

    this.cacheValue = 'x'.repeat(options.cacheItemPayloadBytes);
  }

  async run(): Promise<void> {
    const momento = new SimpleCacheClient(
      this.authToken,
      this.cacheItemTtlSeconds,
      {
        requestTimeoutMs: this.requestTimeoutMs,
        loggerOptions: this.loggerOptions,
      }
    );

    try {
      await momento.createCache(this.cacheName);
    } catch (e) {
      if (e instanceof AlreadyExistsError) {
        this.logger.info(`cache '${this.cacheName}' already exists`);
      } else {
        throw e;
      }
    }

    const numOperationsPerWorker =
      this.totalNumberOfOperationsToExecute / this.numberOfConcurrentRequests;

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

    const asyncGetSetResults = range(this.numberOfConcurrentRequests).map(
      workerId =>
        this.launchAndRunWorkers(
          momento,
          loadGenContext,
          workerId + 1,
          numOperationsPerWorker
        )
    );
    const allResultPromises = Promise.all(asyncGetSetResults);
    await allResultPromises;
    this.logger.info('DONE!');
    // wait a few millis to allow the logger to finish flushing
    await delay(500);
  }

  private async launchAndRunWorkers(
    client: SimpleCacheClient,
    loadGenContext: BasicJavasScriptLoadGenContext,
    workerId: number,
    numOperations: number
  ): Promise<void> {
    for (let i = 1; i <= numOperations; i++) {
      await this.issueAsyncSetGet(client, loadGenContext, workerId, i);

      if (loadGenContext.globalRequestCount % 1000 === 0) {
        this.logger.info(`
cumulative stats:
   total requests: ${
     loadGenContext.globalRequestCount
   } (${BasicJavaScriptLoadGen.tps(
          loadGenContext,
          loadGenContext.globalRequestCount
        )} tps)
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
    }
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
    }

    const getStartTime = process.hrtime();
    const getResult = await this.executeRequestAndUpdateContextCounts(
      loadGenContext,
      () => client.get(this.cacheName, cacheKey)
    );

    if (getResult !== undefined) {
      const getDuration = BasicJavaScriptLoadGen.getElapsedMillis(getStartTime);
      loadGenContext.getLatencies.recordValue(getDuration);
      let valueString: string;
      if (getResult.status === CacheGetStatus.Hit) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const value: string = getResult.text()!;
        valueString = `${value.substring(0, 10)}... (len: ${value.length})`;
      } else {
        valueString = 'n/a';
      }
      if (loadGenContext.globalRequestCount % 1000 === 0) {
        this.logger.info(
          `worker: ${workerId}, worker request: ${operationId}, global request: ${loadGenContext.globalRequestCount}, status: ${getResult.status}, val: ${valueString}`
        );
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
     * Available log levels are TRACE, DEBUG, INFO, WARN, and ERROR.  DEBUG
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
  /**
   * Configures the Momento client to timeout if a request exceeds this limit.
   * Momento client default is 5 seconds.
   */
  requestTimeoutMs: 5 * 1000,
  /**
   * Controls the size of the payload that will be used for the cache items in
   * the load test.  Smaller payloads will generally provide lower latencies than
   * larger payloads.
   */
  cacheItemPayloadBytes: 100,
  /**
   * Controls the number of concurrent requests that will be made (via asynchronous
   * function calls) by the load test.  Increasing this number may improve throughput,
   * but it will also increase CPU consumption.  As CPU usage increases and there
   * is more contention between the concurrent function calls, client-side latencies
   * may increase.
   */
  numberOfConcurrentRequests: 50,
  /**
   * Controls how long the load test will run.  We will execute this many operations
   * (1 cache 'set' followed immediately by 1 'get') across all of our concurrent
   * workers before exiting.  Statistics will be logged every 1000 operations.
   */
  totalNumberOfOperationsToExecute: 50_000,
};

main(loadGeneratorOptions)
  .then(() => {
    console.log('success!!');
    console.log(PERFORMANCE_INFORMATION_MESSAGE);
  })
  .catch(e => {
    console.error('Uncaught exception while running load gen', e);
    throw e;
  });
