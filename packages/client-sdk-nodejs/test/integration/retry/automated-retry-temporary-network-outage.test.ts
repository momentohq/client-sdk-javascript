import {
  DefaultEligibilityStrategy,
  DefaultMomentoLoggerFactory,
  FixedTimeoutRetryStrategy,
} from '../../../src';
import {TestRetryMetricsCollector} from '../../test-retry-metrics-collector';
import {MomentoRPCMethod} from '../../momento-rpc-method';
import {WithCacheAndCacheClient} from '../integration-setup';

describe('Automated retry with temporary network outage', () => {
  let testMetricsCollector: TestRetryMetricsCollector;

  beforeAll(() => {
    testMetricsCollector = new TestRetryMetricsCollector();
  });

  it('should make less than max number of allowed retry attempts for fixed count strategy', async () => {
    await WithCacheAndCacheClient(
      config => config,
      testMetricsCollector,
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

    await WithCacheAndCacheClient(
      config =>
        config
          .withRetryStrategy(retryStrategy)
          .withClientTimeoutMillis(CLIENT_TIMEOUT_MILLIS),
      testMetricsCollector,
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
