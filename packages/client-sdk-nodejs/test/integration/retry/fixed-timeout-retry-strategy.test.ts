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
            MomentoErrorCode.SERVER_UNAVAILABLE
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
  const RETRY_DELAY_MILLIS = 1000;
  const CLIENT_TIMEOUT_MILLIS = 5000;

  beforeAll(() => {
    testMetricsCollector = new TestRetryMetricsCollector();
    momentoLogger = new DefaultMomentoLoggerFactory().getLogger(
      'TestRetryMetricsMiddleware'
    );
    loggerFactory = new DefaultMomentoLoggerFactory();
  });

  it('should get hit/miss response with no retries for fixed timeout strategy if delayMs < responseDataReceivedTimeoutMillis', async () => {
    const retryStrategy = new FixedTimeoutRetryStrategy({
      loggerFactory: loggerFactory,
      retryDelayIntervalMillis: RETRY_DELAY_MILLIS,
      eligibilityStrategy: new DefaultEligibilityStrategy(loggerFactory),
      responseDataReceivedTimeoutMillis: 1000,
    });
    const testMiddlewareArgs: MomentoLocalMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
      delayRpcList: [MomentoRPCMethod.Get],
      delayMillis: 500,
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
        expect(noOfRetries).toBe(0);
      }
    );
  });

  it('should TIMEOUT_ERROR error with no retries for fixed timeout strategy if delayMs > responseDataReceivedTimeoutMillis', async () => {
    const retryStrategy = new FixedTimeoutRetryStrategy({
      loggerFactory: loggerFactory,
      retryDelayIntervalMillis: RETRY_DELAY_MILLIS,
      eligibilityStrategy: new DefaultEligibilityStrategy(loggerFactory),
      responseDataReceivedTimeoutMillis: 1000,
    });
    const testMiddlewareArgs: MomentoLocalMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
      delayRpcList: [MomentoRPCMethod.Get],
      delayMillis: 1500,
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
        const noOfRetries = testMetricsCollector.getTotalRetryCount(
          cacheName,
          MomentoRPCMethod.Get
        );
        expect(noOfRetries).toBe(0);
      }
    );
  });

  it('should get hit/miss response with retries for fixed timeout strategy if delayMs < responseDataReceivedTimeoutMillis', async () => {
    const retryStrategy = new FixedTimeoutRetryStrategy({
      loggerFactory: loggerFactory,
      retryDelayIntervalMillis: RETRY_DELAY_MILLIS,
      eligibilityStrategy: new DefaultEligibilityStrategy(loggerFactory),
      responseDataReceivedTimeoutMillis: 2000,
    });
    const testMiddlewareArgs: MomentoLocalMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
      errorRpcList: [MomentoRPCMethod.Get],
      returnError: MomentoErrorCode.SERVER_UNAVAILABLE,
      errorCount: 2,
      delayRpcList: [MomentoRPCMethod.Get],
      delayMillis: 500,
      delayCount: 2,
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
        expect(noOfRetries).toBe(2);
      }
    );
  });
});
