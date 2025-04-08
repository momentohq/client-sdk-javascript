import {
  CacheGetResponse,
  CacheIncrementResponse,
  DefaultEligibilityStrategy,
  DefaultMomentoLoggerFactory,
  FixedTimeoutRetryStrategy,
  MomentoErrorCode,
  MomentoLogger,
} from '../../../src';
import {TestRetryMetricsCollector} from '../../test-retry-metrics-collector';
import {WithCacheAndCacheClient} from '../integration-setup';
import {v4} from 'uuid';
import {MomentoRPCMethod} from '../../../src/config/retry/momento-rpc-method';
import {MomentoLocalMiddlewareArgs} from '../../momento-local-middleware';

describe('Fixed timeout retry strategy with full network outage', () => {
  let testMetricsCollector: TestRetryMetricsCollector;
  let momentoLogger: MomentoLogger;

  beforeAll(() => {
    testMetricsCollector = new TestRetryMetricsCollector();
    momentoLogger = new DefaultMomentoLoggerFactory().getLogger(
      'TestRetryMetricsMiddleware'
    );
  });

  it('should use default retry delay and timeout when not specified', async () => {
    const DEFAULT_RETRY_DELAY_MILLIS = 100;
    const DEFAULT_RESPONSE_DATA_RECEIVED_TIMEOUT_MILLIS = 1000;
    const RESPONSE_DELAY_MILLIS =
      DEFAULT_RESPONSE_DATA_RECEIVED_TIMEOUT_MILLIS - 100;
    const CLIENT_TIMEOUT_MILLIS = 5000;
    const loggerFactory = new DefaultMomentoLoggerFactory();
    const retryStrategy = new FixedTimeoutRetryStrategy({
      loggerFactory: loggerFactory,
      eligibilityStrategy: new DefaultEligibilityStrategy(loggerFactory),
    });
    const testMiddlewareArgs: MomentoLocalMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
      returnError: MomentoErrorCode.SERVER_UNAVAILABLE,
      errorRpcList: [MomentoRPCMethod.Get],
      delayRpcList: [MomentoRPCMethod.Get],
      delayMillis: RESPONSE_DELAY_MILLIS,
    };

    await WithCacheAndCacheClient(
      config =>
        config
          .withRetryStrategy(retryStrategy)
          .withClientTimeoutMillis(CLIENT_TIMEOUT_MILLIS),
      testMiddlewareArgs,
      async (cacheClient, cacheName) => {
        const getResponse = await cacheClient.get(cacheName, 'key');
        expect(getResponse.type).toEqual(CacheGetResponse.Error);
        if (getResponse.type === CacheGetResponse.Error) {
          expect(getResponse.errorCode()).toEqual(
            MomentoErrorCode.TIMEOUT_ERROR
          );
        }
        const delayBetweenResponses =
          RESPONSE_DELAY_MILLIS + DEFAULT_RETRY_DELAY_MILLIS;
        const expectedRetryCount = Math.floor(
          CLIENT_TIMEOUT_MILLIS / delayBetweenResponses
        );
        const actualRetryCount = testMetricsCollector.getTotalRetryCount(
          cacheName,
          MomentoRPCMethod.Get
        );
        expect(actualRetryCount).toBeGreaterThanOrEqual(expectedRetryCount - 1);
        expect(actualRetryCount).toBeLessThanOrEqual(expectedRetryCount);

        const averageDelayBetweenResponses =
          testMetricsCollector.getAverageTimeBetweenRetries(
            cacheName,
            MomentoRPCMethod.Get
          );
        const minDelay = delayBetweenResponses * 0.9;
        const maxDelay = delayBetweenResponses * 1.1;
        expect(averageDelayBetweenResponses).toBeGreaterThanOrEqual(minDelay);
        expect(averageDelayBetweenResponses).toBeLessThanOrEqual(maxDelay);
      }
    );
  });

  it('should make maximum retry attempts for eligible API with fixed timeout strategy', async () => {
    const RETRY_DELAY_MILLIS = 1000;
    const CLIENT_TIMEOUT_MILLIS = 5000;
    const loggerFactory = new DefaultMomentoLoggerFactory();
    const retryStrategy = new FixedTimeoutRetryStrategy({
      loggerFactory: loggerFactory,
      retryDelayIntervalMillis: RETRY_DELAY_MILLIS,
      eligibilityStrategy: new DefaultEligibilityStrategy(loggerFactory),
    });
    const testMiddlewareArgs: MomentoLocalMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
      returnError: MomentoErrorCode.SERVER_UNAVAILABLE,
      errorRpcList: [MomentoRPCMethod.Get],
    };

    await WithCacheAndCacheClient(
      config =>
        config
          .withRetryStrategy(retryStrategy)
          .withClientTimeoutMillis(CLIENT_TIMEOUT_MILLIS),
      testMiddlewareArgs,
      async (cacheClient, cacheName) => {
        const getResponse = await cacheClient.get(cacheName, 'key');
        expect(getResponse.type).toEqual(CacheGetResponse.Error);
        if (getResponse.type === CacheGetResponse.Error) {
          expect(getResponse.errorCode()).toEqual(
            MomentoErrorCode.TIMEOUT_ERROR
          );
        }
        const expectedRetryCount = Math.floor(
          CLIENT_TIMEOUT_MILLIS / RETRY_DELAY_MILLIS
        );
        const actualRetryCount = testMetricsCollector.getTotalRetryCount(
          cacheName,
          MomentoRPCMethod.Get
        );
        expect(actualRetryCount).toBeGreaterThanOrEqual(expectedRetryCount - 1);
        expect(actualRetryCount).toBeLessThanOrEqual(expectedRetryCount);
      }
    );
  });

  it('should make 0 attempts for retry non-eligible api for fixed timeout strategy', async () => {
    const RETRY_DELAY_MILLIS = 1000;
    const CLIENT_TIMEOUT_MILLIS = 5000;
    const loggerFactory = new DefaultMomentoLoggerFactory();
    const retryStrategy = new FixedTimeoutRetryStrategy({
      loggerFactory: loggerFactory,
      retryDelayIntervalMillis: RETRY_DELAY_MILLIS,
      eligibilityStrategy: new DefaultEligibilityStrategy(loggerFactory),
    });
    const testMiddlewareArgs: MomentoLocalMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
      returnError: MomentoErrorCode.SERVER_UNAVAILABLE,
      errorRpcList: [MomentoRPCMethod.Increment],
    };

    await WithCacheAndCacheClient(
      config =>
        config
          .withRetryStrategy(retryStrategy)
          .withClientTimeoutMillis(CLIENT_TIMEOUT_MILLIS),
      testMiddlewareArgs,
      async (cacheClient, cacheName) => {
        const incrementResponse = await cacheClient.increment(
          cacheName,
          'key',
          1
        );
        expect(incrementResponse.type).toEqual(CacheIncrementResponse.Error);
        const noOfRetries = testMetricsCollector.getTotalRetryCount(
          cacheName,
          MomentoRPCMethod.Increment
        );
        expect(noOfRetries).toBe(0); // Increment is not eligible for retry
      }
    );
  });

  it('should not exceed client timeout when retry timeout is greater than client timeout', async () => {
    const RESPONSE_DATA_RECEIVED_TIMEOUT_MILLIS = 3000;
    const CLIENT_TIMEOUT_MILLIS = 2000;
    const loggerFactory = new DefaultMomentoLoggerFactory();
    const retryStrategy = new FixedTimeoutRetryStrategy({
      loggerFactory: loggerFactory,
      eligibilityStrategy: new DefaultEligibilityStrategy(loggerFactory),
      responseDataReceivedTimeoutMillis: RESPONSE_DATA_RECEIVED_TIMEOUT_MILLIS,
    });
    const testMiddlewareArgs: MomentoLocalMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
      returnError: MomentoErrorCode.SERVER_UNAVAILABLE,
      errorRpcList: [MomentoRPCMethod.Get],
      delayRpcList: [MomentoRPCMethod.Get],
      delayMillis: 1000,
    };

    await WithCacheAndCacheClient(
      config =>
        config
          .withRetryStrategy(retryStrategy)
          .withClientTimeoutMillis(CLIENT_TIMEOUT_MILLIS),
      testMiddlewareArgs,
      async (cacheClient, cacheName) => {
        const getResponse = await cacheClient.get(cacheName, 'key');
        expect(getResponse.type).toEqual(CacheGetResponse.Error);
        if (getResponse.type === CacheGetResponse.Error) {
          expect(getResponse.errorCode()).toEqual(
            MomentoErrorCode.TIMEOUT_ERROR
          );
        }
        const actualRetryCount = testMetricsCollector.getTotalRetryCount(
          cacheName,
          MomentoRPCMethod.Get
        );
        expect(actualRetryCount).toEqual(1);
        const averageDelayBetweenResponses =
          testMetricsCollector.getAverageTimeBetweenRetries(
            cacheName,
            MomentoRPCMethod.Get
          );
        expect(averageDelayBetweenResponses).toBeGreaterThan(0);
        expect(averageDelayBetweenResponses).toBeLessThanOrEqual(
          CLIENT_TIMEOUT_MILLIS
        );
      }
    );
  });
});

describe('Fixed timeout retry strategy with temporary network outage', () => {
  let testMetricsCollector: TestRetryMetricsCollector;
  let momentoLogger: MomentoLogger;

  beforeAll(() => {
    testMetricsCollector = new TestRetryMetricsCollector();
    momentoLogger = new DefaultMomentoLoggerFactory().getLogger(
      'TestRetryMetricsMiddleware'
    );
  });

  it('should make less than max number of attempts for fixed timeout strategy', async () => {
    const RETRY_DELAY_MILLIS = 1000;
    const CLIENT_TIMEOUT_MILLIS = 5000;
    const loggerFactory = new DefaultMomentoLoggerFactory();
    const retryStrategy = new FixedTimeoutRetryStrategy({
      loggerFactory: loggerFactory,
      retryDelayIntervalMillis: RETRY_DELAY_MILLIS,
      eligibilityStrategy: new DefaultEligibilityStrategy(loggerFactory),
    });
    const testMiddlewareArgs: MomentoLocalMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
      returnError: MomentoErrorCode.SERVER_UNAVAILABLE,
      errorRpcList: [MomentoRPCMethod.Get],
      errorCount: 2,
    };

    await WithCacheAndCacheClient(
      config =>
        config
          .withRetryStrategy(retryStrategy)
          .withClientTimeoutMillis(CLIENT_TIMEOUT_MILLIS),
      testMiddlewareArgs,
      async (cacheClient, cacheName) => {
        const getResponse = await cacheClient.get(cacheName, 'key');
        expect(getResponse.type).toEqual(CacheGetResponse.Miss); // Miss because we never set the key
        const noOfRetries = testMetricsCollector.getTotalRetryCount(
          cacheName,
          MomentoRPCMethod.Get
        );
        const totalAttemptsClientCouldHaveMade = Math.floor(
          CLIENT_TIMEOUT_MILLIS / RETRY_DELAY_MILLIS
        );
        expect(noOfRetries).toBeGreaterThan(1);
        expect(noOfRetries).toBeLessThanOrEqual(
          totalAttemptsClientCouldHaveMade
        );

        const averageDelayBetweenResponses =
          testMetricsCollector.getAverageTimeBetweenRetries(
            cacheName,
            MomentoRPCMethod.Get
          );
        expect(averageDelayBetweenResponses).toBeGreaterThan(0);
        expect(averageDelayBetweenResponses).toBeLessThanOrEqual(
          CLIENT_TIMEOUT_MILLIS
        );
      }
    );
  });
});

describe('Fixed timeout retry strategy with delay ms', () => {
  let testMetricsCollector: TestRetryMetricsCollector;
  let momentoLogger: MomentoLogger;
  let loggerFactory: DefaultMomentoLoggerFactory;
  const RETRY_DELAY_MILLIS = 100;
  const RETRY_TIMEOUT_MILLIS = 1000;
  const CLIENT_TIMEOUT_MILLIS = 5000;

  beforeAll(() => {
    testMetricsCollector = new TestRetryMetricsCollector();
    momentoLogger = new DefaultMomentoLoggerFactory().getLogger(
      'TestRetryMetricsMiddleware'
    );
    loggerFactory = new DefaultMomentoLoggerFactory();
  });

  it('should get hit/miss response with no retries for fixed timeout strategy if response is delayed but no error is returned', async () => {
    const retryStrategy = new FixedTimeoutRetryStrategy({
      loggerFactory: loggerFactory,
      eligibilityStrategy: new DefaultEligibilityStrategy(loggerFactory),
      // the retry deadline should not be set when no retries are triggered
      responseDataReceivedTimeoutMillis: 1000,
    });
    const testMiddlewareArgs: MomentoLocalMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
      delayRpcList: [MomentoRPCMethod.Get],
      // first request should have deadline defined by CLIENT_TIMEOUT_MILLIS, not responseDataReceivedTimeoutMillis
      delayMillis: CLIENT_TIMEOUT_MILLIS - 1000,
    };
    await WithCacheAndCacheClient(
      config =>
        config
          .withRetryStrategy(retryStrategy)
          .withClientTimeoutMillis(CLIENT_TIMEOUT_MILLIS),
      testMiddlewareArgs,
      async (cacheClient, cacheName) => {
        // The request should take longer than responseDataReceivedTimeoutMillis because
        // the grpc deadline was not overwritten by the retry interceptor.
        const startTime = new Date();
        const getResponse = await cacheClient.get(cacheName, 'key');
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        expect(duration).toBeGreaterThanOrEqual(CLIENT_TIMEOUT_MILLIS - 1000);
        expect(duration).toBeLessThanOrEqual(CLIENT_TIMEOUT_MILLIS);
        expect(getResponse.type).toEqual(CacheGetResponse.Miss); // Miss because we never set the key
        const noOfRetries = testMetricsCollector.getTotalRetryCount(
          cacheName,
          MomentoRPCMethod.Get
        );
        expect(noOfRetries).toBe(0);
      }
    );
  });

  it('should retry until client timeout when responses have short delays (< responseDataReceivedTimeoutMillis) during full outage', async () => {
    const retryStrategy = new FixedTimeoutRetryStrategy({
      loggerFactory: loggerFactory,
      eligibilityStrategy: new DefaultEligibilityStrategy(loggerFactory),
      responseDataReceivedTimeoutMillis: RETRY_TIMEOUT_MILLIS,
      retryDelayIntervalMillis: RETRY_DELAY_MILLIS,
    });

    const shortDelay = RETRY_DELAY_MILLIS + 100;
    const testMiddlewareArgs: MomentoLocalMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
      delayRpcList: [MomentoRPCMethod.Get],
      delayMillis: shortDelay,
      errorRpcList: [MomentoRPCMethod.Get],
      returnError: MomentoErrorCode.SERVER_UNAVAILABLE,
    };
    await WithCacheAndCacheClient(
      config =>
        config
          .withRetryStrategy(retryStrategy)
          .withClientTimeoutMillis(CLIENT_TIMEOUT_MILLIS),
      testMiddlewareArgs,
      async (cacheClient, cacheName) => {
        const getResponse = await cacheClient.get(cacheName, 'key');
        expect(getResponse.type).toEqual(CacheGetResponse.Error);
        if (getResponse.type === CacheGetResponse.Error) {
          expect(getResponse.errorCode()).toEqual(
            MomentoErrorCode.TIMEOUT_ERROR
          );
        }

        const delayBetweenAttempts = RETRY_DELAY_MILLIS + shortDelay;
        const maxAttempts = Math.ceil(
          CLIENT_TIMEOUT_MILLIS / delayBetweenAttempts
        );
        const noOfRetries = testMetricsCollector.getTotalRetryCount(
          cacheName,
          MomentoRPCMethod.Get
        );
        expect(noOfRetries).toBeGreaterThanOrEqual(2);
        expect(noOfRetries).toBeLessThanOrEqual(maxAttempts);

        // Jitter will be +/- 10% of the delay between retry attempts
        const maxDelay = delayBetweenAttempts * 1.1;
        const minDelay = delayBetweenAttempts * 0.9;
        const averageDelay = testMetricsCollector.getAverageTimeBetweenRetries(
          cacheName,
          MomentoRPCMethod.Get
        );
        expect(averageDelay).toBeGreaterThanOrEqual(minDelay);
        expect(averageDelay).toBeLessThanOrEqual(maxDelay);
      }
    );
  });

  it('should retry until client timeout when responses have long delays (> responseDataReceivedTimeoutMillis) during full outage', async () => {
    const retryStrategy = new FixedTimeoutRetryStrategy({
      loggerFactory: loggerFactory,
      eligibilityStrategy: new DefaultEligibilityStrategy(loggerFactory),
      responseDataReceivedTimeoutMillis: RETRY_TIMEOUT_MILLIS,
      retryDelayIntervalMillis: RETRY_DELAY_MILLIS,
    });

    // Momento-local should delay responses for longer than the retry timeout so that
    // we can test the retry strategy's timeout is actually being respected.
    const longDelay = RETRY_TIMEOUT_MILLIS + 500;
    const testMiddlewareArgs: MomentoLocalMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
      delayRpcList: [MomentoRPCMethod.Get],
      delayMillis: longDelay,
      errorRpcList: [MomentoRPCMethod.Get],
      returnError: MomentoErrorCode.SERVER_UNAVAILABLE,
    };
    await WithCacheAndCacheClient(
      config =>
        config
          .withRetryStrategy(retryStrategy)
          .withClientTimeoutMillis(CLIENT_TIMEOUT_MILLIS),
      testMiddlewareArgs,
      async (cacheClient, cacheName) => {
        const getResponse = await cacheClient.get(cacheName, 'key');
        expect(getResponse.type).toEqual(CacheGetResponse.Error);
        if (getResponse.type === CacheGetResponse.Error) {
          expect(getResponse.errorCode()).toEqual(
            MomentoErrorCode.TIMEOUT_ERROR
          );
        }

        const delayBetweenAttempts = RETRY_DELAY_MILLIS + longDelay;
        const maxAttempts = Math.ceil(
          CLIENT_TIMEOUT_MILLIS / delayBetweenAttempts
        );
        const noOfRetries = testMetricsCollector.getTotalRetryCount(
          cacheName,
          MomentoRPCMethod.Get
        );
        expect(noOfRetries).toBeLessThanOrEqual(maxAttempts);
        // Fixed timeout retry strategy should retry at least twice.
        // If it retries only once, it could mean that the retry attempt is timing out and if we aren't
        // handling that case correctly, then it won't continue retrying until the client timeout is reached.
        expect(noOfRetries).toBeGreaterThanOrEqual(2);

        // Jitter will contribute +/- 10% of the delay between retry attempts, and there will
        // be some time spent making the retry attempt as well (estimating +/- 5%).
        // The expected delay here is not longDelay because the retry strategy's timeout is
        // shorter than that and retry attempts should stop before longDelay is reached.
        const expectedDelayBetweenAttempts =
          RETRY_TIMEOUT_MILLIS + RETRY_DELAY_MILLIS;
        const maxDelay = expectedDelayBetweenAttempts * 1.15;
        const minDelay = expectedDelayBetweenAttempts * 0.85;
        const averageDelay = testMetricsCollector.getAverageTimeBetweenRetries(
          cacheName,
          MomentoRPCMethod.Get
        );
        expect(averageDelay).toBeGreaterThanOrEqual(minDelay);
        expect(averageDelay).toBeLessThanOrEqual(maxDelay);
      }
    );
  });
});
