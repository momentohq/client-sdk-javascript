import {
  CacheGetResponse,
  CacheIncrementResponse,
  DefaultMomentoLoggerFactory,
  MomentoLogger,
} from '../../../src';
import {TestRetryMetricsCollector} from '../../test-retry-metrics-collector';
import {
  MomentoRPCMethod,
  MomentoRPCMethodConverter,
} from '../../momento-rpc-method';
import {WithCacheAndCacheClient} from '../integration-setup';
import {TestRetryMetricsMiddlewareArgs} from '../../test-retry-metrics-middleware';
import {v4} from 'uuid';

describe('Fixed count retry strategy with full network outage', () => {
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
      errorRpcList: [MomentoRPCMethodConverter.convert(MomentoRPCMethod.Get)],
    };

    await WithCacheAndCacheClient(
      config => config,
      testMiddlewareArgs,
      async (cacheClient, cacheName) => {
        const getResponse = await cacheClient.get(cacheName, 'key');
        expect(getResponse.type).toEqual(CacheGetResponse.Error);
        if (getResponse.type === CacheGetResponse.Error) {
          expect(getResponse.errorCode()).toEqual('SERVER_UNAVAILABLE');
        }
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
      errorRpcList: [
        MomentoRPCMethodConverter.convert(MomentoRPCMethod.Increment),
      ],
    };
    await WithCacheAndCacheClient(
      config => config,
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

describe('Fixed count retry strategy with temporary network outage', () => {
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
      errorRpcList: [MomentoRPCMethodConverter.convert(MomentoRPCMethod.Get)],
      errorCount: 2,
    };
    await WithCacheAndCacheClient(
      config => config,
      testMiddlewareArgs,
      async (cacheClient, cacheName) => {
        const getResponse = await cacheClient.get(cacheName, 'key');
        expect(getResponse.type).toEqual(CacheGetResponse.Miss); // Miss because we never set the key
        const noOfRetries = testMetricsCollector.getTotalRetryCount(
          cacheName,
          MomentoRPCMethod.Get
        );
        expect(noOfRetries).toBeGreaterThan(1);
        expect(noOfRetries).toBeLessThanOrEqual(3);
      }
    );
  });
});
