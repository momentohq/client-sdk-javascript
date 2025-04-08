import {
  CacheGetResponse,
  CacheIncrementResponse,
  DefaultMomentoLoggerFactory,
  ExponentialBackoffRetryStrategy,
  MomentoErrorCode,
  MomentoLogger,
} from '../../../src';
import {TestRetryMetricsCollector} from '../../test-retry-metrics-collector';
import {MomentoRPCMethod} from '../../../src/config/retry/momento-rpc-method';
import {WithCacheAndCacheClient} from '../integration-setup';
import {MomentoLocalMiddlewareArgs} from '../../momento-local-middleware';
import {v4} from 'uuid';

describe('ExponentialBackoffRetryStrategy integration tests', () => {
  let testMetricsCollector: TestRetryMetricsCollector;
  let momentoLogger: MomentoLogger;
  let loggerFactory: DefaultMomentoLoggerFactory;

  beforeAll(() => {
    testMetricsCollector = new TestRetryMetricsCollector();
    loggerFactory = new DefaultMomentoLoggerFactory();
    momentoLogger = loggerFactory.getLogger(
      'ExponentialBackoffIntegrationTest'
    );
  });

  describe('Full network outage', () => {
    it('should make multiple attempts for retry-eligible APIs until client times out', async () => {
      // Example config
      const CLIENT_TIMEOUT_MILLIS = 5000;
      const exponentialBackoffRetryStrategy =
        new ExponentialBackoffRetryStrategy({
          loggerFactory,
          initialDelayMillis: 100,
          maxBackoffMillis: 2000,
        });

      // Simulate server UNAVAILABLE for all attempts
      const momentoLocalMiddlewareArgs: MomentoLocalMiddlewareArgs = {
        logger: momentoLogger,
        testMetricsCollector,
        requestId: v4(),
        returnError: MomentoErrorCode.SERVER_UNAVAILABLE,
        errorRpcList: [MomentoRPCMethod.Get],
      };

      await WithCacheAndCacheClient(
        config =>
          config
            .withRetryStrategy(exponentialBackoffRetryStrategy)
            .withClientTimeoutMillis(CLIENT_TIMEOUT_MILLIS),
        momentoLocalMiddlewareArgs,
        async (cacheClient, cacheName) => {
          const getResponse = await cacheClient.get(cacheName, 'key');
          expect(getResponse.type).toEqual(CacheGetResponse.Error);
          if (getResponse.type === CacheGetResponse.Error) {
            expect(getResponse.errorCode()).toEqual(
              MomentoErrorCode.TIMEOUT_ERROR
            );
          }

          // Evaluate how many retries were attempted.
          // Because exponential backoff strategy grows the delay each time,
          // you won't get as many attempts as the fixed-time strategy might.
          const retries = testMetricsCollector.getTotalRetryCount(
            cacheName,
            MomentoRPCMethod.Get
          );

          // Usually you'll expect at least a couple of retries.
          expect(retries).toBeGreaterThanOrEqual(2);
          expect(retries).toBeLessThanOrEqual(5);
        }
      );
    });

    it('should make 0 attempts for retry non-eligible APIs', async () => {
      const exponentialBackoffRetryStrategy =
        new ExponentialBackoffRetryStrategy({
          loggerFactory,
        });

      const momentoLocalMiddlewareArgs: MomentoLocalMiddlewareArgs = {
        logger: momentoLogger,
        testMetricsCollector,
        requestId: v4(),
        returnError: MomentoErrorCode.SERVER_UNAVAILABLE,
        errorRpcList: [MomentoRPCMethod.Increment],
      };

      await WithCacheAndCacheClient(
        config => config.withRetryStrategy(exponentialBackoffRetryStrategy),
        momentoLocalMiddlewareArgs,
        async (cacheClient, cacheName) => {
          const incrementResponse = await cacheClient.increment(
            cacheName,
            'key',
            1
          );
          expect(incrementResponse.type).toEqual(CacheIncrementResponse.Error);
          const retries = testMetricsCollector.getTotalRetryCount(
            cacheName,
            MomentoRPCMethod.Increment
          );
          expect(retries).toBe(0); // Not eligible for retry
        }
      );
    });
  });

  describe('Temporary network outage', () => {
    it('should succeed with fewer retries once the service becomes available', async () => {
      const CLIENT_TIMEOUT_MILLIS = 4000;
      const exponentialBackoffRetryStrategy =
        new ExponentialBackoffRetryStrategy({
          loggerFactory,
          initialDelayMillis: 100,
          maxBackoffMillis: 2000,
        });

      // Return "unavailable" for first 2 calls, then succeed
      const momentoLocalMiddlewareArgs: MomentoLocalMiddlewareArgs = {
        logger: momentoLogger,
        testMetricsCollector,
        requestId: v4(),
        returnError: MomentoErrorCode.SERVER_UNAVAILABLE,
        errorRpcList: [MomentoRPCMethod.Get],
        errorCount: 2, // after 2 errors, subsequent requests succeed
      };

      await WithCacheAndCacheClient(
        config =>
          config
            .withRetryStrategy(exponentialBackoffRetryStrategy)
            .withClientTimeoutMillis(CLIENT_TIMEOUT_MILLIS),
        momentoLocalMiddlewareArgs,
        async (cacheClient, cacheName) => {
          const getResponse = await cacheClient.get(cacheName, 'key');
          // Because we never actually set the key, it should be a Miss
          // indicating it eventually succeeded connecting to the server
          expect(getResponse.type).toEqual(CacheGetResponse.Miss);

          const retries = testMetricsCollector.getTotalRetryCount(
            cacheName,
            MomentoRPCMethod.Get
          );
          // We had to retry at least once or twice
          expect(retries).toBeGreaterThanOrEqual(1);
          // Should still be less than some upper bound, e.g., client timeout
          // with exponential growth, we won't see 10 attempts in 4 seconds if
          // the backoff gets big quickly.
          expect(retries).toBeLessThanOrEqual(4);
        }
      );
    });
  });
});
