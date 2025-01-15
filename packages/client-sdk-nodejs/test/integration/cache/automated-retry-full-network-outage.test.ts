import {TestRetryMetricsMiddleware} from '../../test-retry-metrics-middleware';
import {
  CacheClient,
  Configuration,
  Configurations,
  DefaultEligibilityStrategy,
  DefaultMomentoLoggerFactory,
  FixedTimeoutRetryStrategy,
  MomentoLocalProvider,
} from '../../../src';
import {TestRetryMetricsCollector} from '../../test-retry-metrics-collector';
import {v4} from 'uuid';
import {MomentoRPCMethod} from '../../momento-rpc-method';

describe('Automated retry with full network outage', () => {
  let middleware: TestRetryMetricsMiddleware;
  let testMetricsCollector: TestRetryMetricsCollector;
  let cacheName: string;
  let credentialProvider: MomentoLocalProvider;

  beforeAll(() => {
    testMetricsCollector = new TestRetryMetricsCollector();
    credentialProvider = new MomentoLocalProvider();
  });

  beforeEach(async () => {
    cacheName = v4();
    middleware = new TestRetryMetricsMiddleware(
      new DefaultMomentoLoggerFactory().getLogger('TestRetryMetricsMiddleware'),
      testMetricsCollector,
      v4()
    );
    const cacheClient = await CacheClient.create({
      configuration: Configurations.Laptop.v1(),
      credentialProvider: credentialProvider,
      defaultTtlSeconds: 60,
    });
    await cacheClient.createCache(cacheName);
  });

  const createCacheClient = async (
    configFn: (config: Configuration) => Configuration
  ) => {
    return await CacheClient.create({
      configuration: configFn(
        Configurations.Laptop.v1().withMiddlewares([middleware])
      ),
      credentialProvider: credentialProvider,
      defaultTtlSeconds: 60,
    });
  };

  it('should make max 3 attempts for retry eligible api for fixed count strategy', async () => {
    const cacheClient = await createCacheClient(config => config);
    await cacheClient.get(cacheName, 'key');
    const noOfRetries = testMetricsCollector.getTotalRetryCount(
      cacheName,
      MomentoRPCMethod.Get
    );
    expect(noOfRetries).toBe(3);
  });

  it('should make 0 attempts for retry non-eligible api for fixed count strategy', async () => {
    const cacheClient = await createCacheClient(config => config);
    await cacheClient.increment(cacheName, 'key', 1);
    const noOfRetries = testMetricsCollector.getTotalRetryCount(
      cacheName,
      MomentoRPCMethod.Increment
    );
    expect(noOfRetries).toBe(0);
  });

  it('should make maximum retry attempts for eligible API with fixed timeout strategy', async () => {
    const RETRY_DELAY_SECONDS = 1;
    const CLIENT_TIMEOUT_SECONDS = 5;
    const loggerFactory = new DefaultMomentoLoggerFactory();
    const retryStrategy = new FixedTimeoutRetryStrategy({
      loggerFactory: loggerFactory,
      retryDelayIntervalMillis: RETRY_DELAY_SECONDS * 1000,
      eligibilityStrategy: new DefaultEligibilityStrategy(loggerFactory),
    });

    const cacheClient = await createCacheClient(config =>
      config
        .withRetryStrategy(retryStrategy)
        .withClientTimeoutMillis(CLIENT_TIMEOUT_SECONDS * 1000)
    );
    await cacheClient.get(cacheName, 'key');
    const expectedRetryCount = Math.floor(
      CLIENT_TIMEOUT_SECONDS / RETRY_DELAY_SECONDS
    );
    const actualRetryCount = testMetricsCollector.getTotalRetryCount(
      cacheName,
      MomentoRPCMethod.Get
    );
    expect(actualRetryCount).toBeGreaterThanOrEqual(expectedRetryCount - 1);
    expect(actualRetryCount).toBeLessThanOrEqual(expectedRetryCount);
  });

  it('should make 0 attempts for retry non-eligible api for fixed timeout strategy', async () => {
    const RETRY_DELAY_SECONDS = 1;
    const CLIENT_TIMEOUT_SECONDS = 5;
    const retryStrategy = new FixedTimeoutRetryStrategy({
      loggerFactory: new DefaultMomentoLoggerFactory(),
      retryDelayIntervalMillis: RETRY_DELAY_SECONDS * 1000,
    });

    const cacheClient = await createCacheClient(config =>
      config
        .withRetryStrategy(retryStrategy)
        .withClientTimeoutMillis(CLIENT_TIMEOUT_SECONDS * 1000)
    );
    await cacheClient.increment(cacheName, 'key', 1);
    const noOfRetries = testMetricsCollector.getTotalRetryCount(
      cacheName,
      MomentoRPCMethod.Increment
    );
    expect(noOfRetries).toBe(0);
  });
});
