import {TestRetryMetricsMiddleware} from '../../test-retry-metrics-middleware';
import {
  CacheClient,
  Configuration,
  Configurations,
  DefaultMomentoLoggerFactory,
  FixedTimeoutRetryStrategy,
  MomentoLocalProvider,
} from '../../../src';
import {TestRetryMetricsCollector} from '../../test-retry-metrics-collector';
import {v4} from 'uuid';
import {MomentoRPCMethod} from '../../momento-rpc-method';

describe('Automated retry with temporary network outage', () => {
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

  it('should make less than max number of allowed retry attempts for fixed count strategy', async () => {
    const cacheClient = await createCacheClient(config => config);
    await cacheClient.get(cacheName, 'key');
    const noOfRetries = testMetricsCollector.getTotalRetryCount(
      cacheName,
      MomentoRPCMethod.Get
    );
    expect(noOfRetries).toBeLessThanOrEqual(3);
  });

  it('should make less than max number of attempts for fixed timeout strategy', async () => {
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
    await cacheClient.get(cacheName, 'key');
    const noOfRetries = testMetricsCollector.getTotalRetryCount(
      cacheName,
      MomentoRPCMethod.Get
    );
    const totalAttemptsClientCouldHaveMade = Math.floor(
      CLIENT_TIMEOUT_SECONDS / RETRY_DELAY_SECONDS
    );
    expect(noOfRetries).toBeLessThanOrEqual(totalAttemptsClientCouldHaveMade);

    const delayBetweenResponses =
      testMetricsCollector.getAverageTimeBetweenRetries(
        cacheName,
        MomentoRPCMethod.Get
      );
    expect(delayBetweenResponses).toBeLessThanOrEqual(CLIENT_TIMEOUT_SECONDS);
  });
});
