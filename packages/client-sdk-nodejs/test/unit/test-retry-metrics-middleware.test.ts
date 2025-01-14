import {TestRetryMetricsMiddleware} from '../test-retry-metrics-middleware';
import {TestRetryMetricsCollector} from '../test-retry-metrics-collector';
import {CredentialProvider, MomentoLogger} from '@gomomento/sdk-core';
import {CacheClient, Configurations} from '../../src';
import {MomentoRPCMethod} from '../momento-rpc-method';
import {v4} from 'uuid';

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

  test('should add a timestamp on request body for a single cache', async () => {
    const cacheName = v4();
    await cacheClient.get(cacheName, 'key');
    const allMetrics = testMetricsCollector.getAllMetrics();
    expect(allMetrics).toEqual({
      [cacheName]: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        [MomentoRPCMethod.Get]: expect.arrayContaining([expect.any(Number)]),
      },
    });
  });

  test('should add a timestamp on request body for multiple caches', async () => {
    const cacheName1 = v4();
    const cacheName2 = v4();
    await cacheClient.get(cacheName1, 'key');
    await cacheClient.get(cacheName2, 'key');
    const allMetrics = testMetricsCollector.getAllMetrics();
    expect(allMetrics).toEqual({
      [cacheName1]: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        [MomentoRPCMethod.Get]: expect.arrayContaining([expect.any(Number)]),
      },
      [cacheName2]: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        [MomentoRPCMethod.Get]: expect.arrayContaining([expect.any(Number)]),
      },
    });
  });

  test('should add a timestamp on request body for multiple requests', async () => {
    const cacheName = v4();
    await cacheClient.set(cacheName, 'key', 'value');
    await cacheClient.get(cacheName, 'key');
    const allMetrics = testMetricsCollector.getAllMetrics();
    expect(allMetrics).toEqual({
      [cacheName]: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        [MomentoRPCMethod.Get]: expect.arrayContaining([expect.any(Number)]),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        [MomentoRPCMethod.Set]: expect.arrayContaining([expect.any(Number)]),
      },
    });
  });
});
