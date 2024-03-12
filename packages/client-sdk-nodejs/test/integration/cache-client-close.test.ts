import {credsProvider} from './integration-setup';
import {CacheClientPropsWithConfig} from '../../src/internal/cache-client-props-with-config';
import {
  CacheClient,
  Configurations,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
  ExperimentalEventLoopPerformanceMetricsMiddleware,
} from '../../src';

describe("Test exercises closing a client and jest doesn't hang", () => {
  it('constructs a client with background task and closes it', () => {
    const client = new CacheClient(
      integrationTestCacheClientPropsWithExperimentalMetricsMiddleware()
    );
    client.close();
  });
});

function integrationTestCacheClientPropsWithExperimentalMetricsMiddleware(): CacheClientPropsWithConfig {
  const loggerFactory = new DefaultMomentoLoggerFactory(
    DefaultMomentoLoggerLevel.INFO
  );
  return {
    configuration: Configurations.Laptop.latest(loggerFactory)
      .withClientTimeoutMillis(90000)
      .withMiddlewares([
        new ExperimentalEventLoopPerformanceMetricsMiddleware(loggerFactory),
      ]),
    credentialProvider: credsProvider(),
    defaultTtlSeconds: 1111,
  };
}
