import {TestRetryMetricsMiddleware} from '../../test-retry-metrics-middleware';
import {
  CacheClient,
  Configurations,
  DefaultEligibilityStrategy,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
  FixedTimeoutRetryStrategy,
  MomentoLocalProvider,
  MomentoLogger,
} from '../../../src';
import {TestRetryMetricsCollector} from '../../test-retry-metrics-collector';
import {v4} from 'uuid';
import {MomentoRPCMethod} from '../../momento-rpc-method';

describe('Automated retry with full network outage', () => {
  let middleware: TestRetryMetricsMiddleware;
  let testMetricsCollector: TestRetryMetricsCollector;
  let momentoLogger: MomentoLogger;
  let credentialProvider: MomentoLocalProvider;
  let cacheName: string;
  beforeAll(async () => {
    testMetricsCollector = new TestRetryMetricsCollector();
    momentoLogger = {
      debug: (message: string) => console.log(message),
      info: (message: string) => console.log(message),
    } as unknown as MomentoLogger;
    credentialProvider = new MomentoLocalProvider();
    cacheName = 'test-cache';
    const cacheClient = await CacheClient.create({
      configuration: Configurations.Laptop.v1(),
      credentialProvider: credentialProvider,
      defaultTtlSeconds: 60,
    });
    await cacheClient.createCache(cacheName);
  });

  beforeEach(() => {
    middleware = new TestRetryMetricsMiddleware(
      momentoLogger,
      testMetricsCollector,
      v4()
    );
  });

  it('should make max 3 attempts for retry eligible api for fixed count strategy', async () => {
    const cacheClient = await CacheClient.create({
      configuration: Configurations.Laptop.v1().withMiddlewares([middleware]), // default retry strategy is fixed count
      credentialProvider: credentialProvider,
      defaultTtlSeconds: 60,
    });

    const resp = await cacheClient.get(cacheName, 'key');
    console.log(resp);
    const allMetrics = testMetricsCollector.getAllMetrics();
    console.log(allMetrics);
    const noOfRetries = testMetricsCollector.getTotalRetryCount(
      cacheName,
      MomentoRPCMethod.Get
    );
    expect(noOfRetries).toBe(3);
  });

  it('should make 0 attempts for retry non-eligible api for fixed count strategy', async () => {
    const cacheClient = await CacheClient.create({
      configuration: Configurations.Laptop.v1().withMiddlewares([middleware]), // default retry strategy is fixed count
      credentialProvider: credentialProvider,
      defaultTtlSeconds: 60,
    });

    await cacheClient.increment(cacheName, 'key', 1);
    const allMetrics = testMetricsCollector.getAllMetrics();
    console.log(allMetrics);
    const noOfRetries = testMetricsCollector.getTotalRetryCount(
      cacheName,
      MomentoRPCMethod.Increment
    );
    expect(noOfRetries).toBe(0);
  });

  it('should make maximum attempts for retry eligible api for fixed timeout strategy', async () => {
    const retryDelayIntervalSeconds = 1;
    const clientTimeoutSeconds = 5;
    const loggerFactory = new DefaultMomentoLoggerFactory(
      DefaultMomentoLoggerLevel.DEBUG
    );
    const retryStrategy = new FixedTimeoutRetryStrategy({
      loggerFactory: loggerFactory,
      retryDelayIntervalMillis: retryDelayIntervalSeconds * 1000,
      eligibilityStrategy: new DefaultEligibilityStrategy(loggerFactory),
    });

    const cacheClient = await CacheClient.create({
      configuration: Configurations.Laptop.v1()
        .withMiddlewares([middleware])
        .withRetryStrategy(retryStrategy)
        .withClientTimeoutMillis(clientTimeoutSeconds * 1000),
      credentialProvider: credentialProvider,
      defaultTtlSeconds: 60,
    });

    await cacheClient.get(cacheName, 'key');
    // setTimeout(_ => Promise.resolve(), 10000);
    const expectedRetryCount = Math.floor(
      clientTimeoutSeconds / retryDelayIntervalSeconds
    );
    const noOfRetries = testMetricsCollector.getTotalRetryCount(
      cacheName,
      MomentoRPCMethod.Get
    );
    expect(noOfRetries).toBeGreaterThanOrEqual(expectedRetryCount - 1);
    expect(noOfRetries).toBeLessThanOrEqual(expectedRetryCount);
  });

  it('should make 0 attempts for retry non-eligible api for fixed timeout strategy', async () => {
    const retryDelayIntervalSeconds = 1;
    const clientTimeoutSeconds = 5;
    const retryStrategy = new FixedTimeoutRetryStrategy({
      loggerFactory: new DefaultMomentoLoggerFactory(),
      retryDelayIntervalMillis: retryDelayIntervalSeconds * 1000,
    });

    const cacheClient = await CacheClient.create({
      configuration: Configurations.Laptop.v1()
        .withMiddlewares([middleware])
        .withRetryStrategy(retryStrategy)
        .withClientTimeoutMillis(clientTimeoutSeconds * 1000),
      credentialProvider: credentialProvider,
      defaultTtlSeconds: 60,
    });
    await cacheClient.increment(cacheName, 'key', 1);
    const noOfRetries = testMetricsCollector.getTotalRetryCount(
      cacheName,
      MomentoRPCMethod.Increment
    );
    expect(noOfRetries).toBe(0);
  });
});

describe('Automated retry with temporary network outage', () => {
  let middleware: TestRetryMetricsMiddleware;
  let cacheClient: CacheClient;
  let testMetricsCollector: TestRetryMetricsCollector;
  let momentoLogger: MomentoLogger;
  let credentialProvider: MomentoLocalProvider;
  beforeAll(() => {
    testMetricsCollector = new TestRetryMetricsCollector();
    momentoLogger = {
      debug: (message: string) => console.log(message),
      info: (message: string) => console.log(message),
    } as unknown as MomentoLogger;
    credentialProvider = new MomentoLocalProvider();
  });

  beforeEach(() => {
    middleware = new TestRetryMetricsMiddleware(
      momentoLogger,
      testMetricsCollector,
      v4()
    );
  });

  it('should make less than max number of allowed retry attempts for fixed count strategy', async () => {
    cacheClient = await CacheClient.create({
      configuration: Configurations.Laptop.v1().withMiddlewares([middleware]), // default retry strategy is fixed count
      credentialProvider: credentialProvider,
      defaultTtlSeconds: 60,
    });
    const cacheName = v4();
    await cacheClient.get(cacheName, 'key');
    const noOfRetries = testMetricsCollector.getTotalRetryCount(
      cacheName,
      MomentoRPCMethod.Get
    );
    expect(noOfRetries).toBeLessThanOrEqual(3);
  });

  it('should make less than max number of attempts it could have made for fixed timeout strategy', async () => {
    const retryDelayIntervalSeconds = 1;
    const clientTimeoutSeconds = 5;
    const retryStrategy = new FixedTimeoutRetryStrategy({
      loggerFactory: new DefaultMomentoLoggerFactory(),
      retryDelayIntervalMillis: retryDelayIntervalSeconds * 1000,
    });

    cacheClient = await CacheClient.create({
      configuration: Configurations.Laptop.v1()
        .withMiddlewares([middleware])
        .withRetryStrategy(retryStrategy),
      credentialProvider: credentialProvider,
      defaultTtlSeconds: 60,
      eagerConnectTimeout: clientTimeoutSeconds,
    });
    const cacheName = v4();
    await cacheClient.get(cacheName, 'key');
    const noOfRetries = testMetricsCollector.getTotalRetryCount(
      cacheName,
      MomentoRPCMethod.Get
    );
    const totalAttemptsClientCouldHaveMade = Math.floor(
      clientTimeoutSeconds / retryDelayIntervalSeconds
    );
    expect(noOfRetries).toBeLessThanOrEqual(totalAttemptsClientCouldHaveMade);

    const delayBetweenResponses =
      testMetricsCollector.getAverageTimeBetweenRetries(
        cacheName,
        MomentoRPCMethod.Get
      );
    expect(delayBetweenResponses).toBeLessThanOrEqual(clientTimeoutSeconds);
  });
});
