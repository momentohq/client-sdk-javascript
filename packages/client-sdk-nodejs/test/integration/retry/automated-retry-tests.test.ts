import {
  DefaultEligibilityStrategy,
  DefaultMomentoLoggerFactory,
  FixedTimeoutRetryStrategy,
  MomentoLogger,
} from '../../../src';
import {TestRetryMetricsCollector} from '../../test-retry-metrics-collector';
import {MomentoRPCMethod} from '../../momento-rpc-method';
import {WithCacheAndCacheClient} from '../integration-setup';
import {TestRetryMetricsMiddlewareArgs} from '../../test-retry-metrics-middleware';
import {v4} from 'uuid';

describe('Automated retry with full network outage', () => {
  let testMetricsCollector: TestRetryMetricsCollector;
  let momentoLogger: MomentoLogger;

  beforeAll(() => {
    testMetricsCollector = new TestRetryMetricsCollector();
    momentoLogger = new DefaultMomentoLoggerFactory().getLogger(
      'TestRetryMetricsMiddleware'
    );
  });

  it('should make max 3 attempts for retry eligible api for fixed count strategy', async () => {
    const testMiddlewareArgs: TestRetryMetricsMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
      returnError: 'unavailable',
      errorRpcList: ['get'],
    };

    await WithCacheAndCacheClient(
      config => config,
      testMiddlewareArgs,
      async (cacheClient, cacheName) => {
        await cacheClient.get(cacheName, 'key');
        const noOfRetries = testMetricsCollector.getTotalRetryCount(
          cacheName,
          MomentoRPCMethod.Get
        );
        expect(noOfRetries).toBe(3);
      }
    );
  });

  it('should make 0 attempts for retry non-eligible api for fixed count strategy', async () => {
    const testMiddlewareArgs: TestRetryMetricsMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
      returnError: 'unavailable',
      errorRpcList: ['get'],
    };
    await WithCacheAndCacheClient(
      config => config,
      testMiddlewareArgs,
      async (cacheClient, cacheName) => {
        await cacheClient.increment(cacheName, 'key', 1);
        const noOfRetries = testMetricsCollector.getTotalRetryCount(
          cacheName,
          MomentoRPCMethod.Increment
        );
        expect(noOfRetries).toBe(0);
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
    const testMiddlewareArgs: TestRetryMetricsMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
      returnError: 'unavailable',
      errorRpcList: ['get'],
    };

    await WithCacheAndCacheClient(
      config =>
        config
          .withRetryStrategy(retryStrategy)
          .withClientTimeoutMillis(CLIENT_TIMEOUT_MILLIS),
      testMiddlewareArgs,
      async (cacheClient, cacheName) => {
        await cacheClient.get(cacheName, 'key');
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
    const testMiddlewareArgs: TestRetryMetricsMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
      returnError: 'unavailable',
      errorRpcList: ['get'],
    };

    await WithCacheAndCacheClient(
      config =>
        config
          .withRetryStrategy(retryStrategy)
          .withClientTimeoutMillis(CLIENT_TIMEOUT_MILLIS),
      testMiddlewareArgs,
      async (cacheClient, cacheName) => {
        await cacheClient.increment(cacheName, 'key', 1);
        const noOfRetries = testMetricsCollector.getTotalRetryCount(
          cacheName,
          MomentoRPCMethod.Increment
        );
        expect(noOfRetries).toBe(0);
      }
    );
  });
});

describe('Automated retry with temporary network outage', () => {
  let testMetricsCollector: TestRetryMetricsCollector;
  let momentoLogger: MomentoLogger;

  beforeAll(() => {
    testMetricsCollector = new TestRetryMetricsCollector();
    momentoLogger = new DefaultMomentoLoggerFactory().getLogger(
      'TestRetryMetricsMiddleware'
    );
  });

  it('should make less than max number of allowed retry attempts for fixed count strategy', async () => {
    const testMiddlewareArgs: TestRetryMetricsMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
      returnError: 'unavailable',
      errorRpcList: ['get'],
      errorCount: 2,
    };
    await WithCacheAndCacheClient(
      config => config,
      testMiddlewareArgs,
      async (cacheClient, cacheName) => {
        await cacheClient.get(cacheName, 'key');
        const noOfRetries = testMetricsCollector.getTotalRetryCount(
          cacheName,
          MomentoRPCMethod.Get
        );
        expect(noOfRetries).toBeGreaterThan(1);
        expect(noOfRetries).toBeLessThanOrEqual(3);
      }
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
    const testMiddlewareArgs: TestRetryMetricsMiddlewareArgs = {
      logger: momentoLogger,
      testMetricsCollector: testMetricsCollector,
      requestId: v4(),
      returnError: 'unavailable',
      errorRpcList: ['get'],
      errorCount: 2,
    };

    await WithCacheAndCacheClient(
      config =>
        config
          .withRetryStrategy(retryStrategy)
          .withClientTimeoutMillis(CLIENT_TIMEOUT_MILLIS),
      testMiddlewareArgs,
      async (cacheClient, cacheName) => {
        await cacheClient.get(cacheName, 'key');
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
