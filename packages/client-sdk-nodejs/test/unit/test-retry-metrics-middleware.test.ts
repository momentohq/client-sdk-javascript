import {TestRetryMetricsMiddleware} from '../integration/test-retry-metrics-middleware';
import {TestRetryMetricsCollector} from '../integration/test-retry-metrics-collector';
import {CredentialProvider, MomentoLogger} from '@gomomento/sdk-core';
import {CacheClient, Configurations} from '../../src';

describe('TestRetryMetricsMiddleware', () => {
  let middleware: TestRetryMetricsMiddleware;
  let cacheClient: CacheClient;
  let testMetricsCollector: TestRetryMetricsCollector;
  let momentoLogger: MomentoLogger;

  beforeEach(async () => {
    testMetricsCollector = new TestRetryMetricsCollector();
    momentoLogger = {
      debug: (message: string) => console.log(message),
      info: (message: string) => console.log(message),
    } as unknown as MomentoLogger;
    middleware = new TestRetryMetricsMiddleware(
      momentoLogger,
      testMetricsCollector
    );

    // Create CacheClient with middleware enabled
    cacheClient = await CacheClient.create({
      configuration: Configurations.Laptop.v1().withMiddlewares([middleware]),
      credentialProvider:
        CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
      defaultTtlSeconds: 60,
    });
  });

  test('should add a timestamp on request body when cache name is available', async () => {
    const cacheName = 'middleware-cache';
    await cacheClient.get(cacheName, 'key');
    const allMetrics = testMetricsCollector.getAllMetrics();
    expect(allMetrics).toEqual({
      [cacheName]: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        _GetRequest: expect.arrayContaining([expect.any(Number)]),
      },
    });
  });
});
