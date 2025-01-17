import {
  DefaultEligibilityStrategy,
  DefaultMomentoLoggerFactory,
  FixedTimeoutRetryStrategy,
} from '../../../src';
import {TestRetryMetricsCollector} from '../../test-retry-metrics-collector';
import {MomentoRPCMethod} from '../../momento-rpc-method';
import {WithCacheAndCacheClient} from '../integration-setup';

describe('Automated retry with full network outage', () => {
  let testMetricsCollector: TestRetryMetricsCollector;

  beforeAll(() => {
    testMetricsCollector = new TestRetryMetricsCollector();
  });

  it('should make max 3 attempts for retry eligible api for fixed count strategy', async () => {
    await WithCacheAndCacheClient(
      config => config,
      testMetricsCollector,
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
    await WithCacheAndCacheClient(
      config => config,
      testMetricsCollector,
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

    await WithCacheAndCacheClient(
      config =>
        config
          .withRetryStrategy(retryStrategy)
          .withClientTimeoutMillis(CLIENT_TIMEOUT_MILLIS),
      testMetricsCollector,
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

    await WithCacheAndCacheClient(
      config =>
        config
          .withRetryStrategy(retryStrategy)
          .withClientTimeoutMillis(CLIENT_TIMEOUT_MILLIS),
      testMetricsCollector,
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
