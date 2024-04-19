import {credsProvider} from './integration-setup';
import {CacheClientPropsWithConfig} from '../../src/internal/cache-client-props-with-config';
import {
  CacheClient,
  Configurations,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
  Middleware,
  MiddlewareFactory,
} from '../../src';

describe("Test exercises closing a client and jest doesn't hang", () => {
  it('constructs a client with background task and closes it', async () => {
    let client;
    let middleware;
    try {
      const loggerFactory = new DefaultMomentoLoggerFactory(
        DefaultMomentoLoggerLevel.INFO
      );
      middleware = MiddlewareFactory.createMetricsMiddlewares(loggerFactory, {
        eventLoopMetricsLog: true,
        garbageCollectionMetricsLog: true,
        activeRequestCountMetricsLog: true,
      });
      client = await CacheClient.create(
        integrationTestCacheClientPropsWithExperimentalMetricsMiddleware(
          loggerFactory,
          middleware
        )
      );
    } catch (e) {
      middleware?.forEach(m => {
        if (m.close !== undefined) {
          m.close();
        }
      });
      throw e;
    } finally {
      if (client) client.close();
    }
  });
});

function integrationTestCacheClientPropsWithExperimentalMetricsMiddleware(
  loggerFactory: DefaultMomentoLoggerFactory,
  middleware: Middleware[]
): CacheClientPropsWithConfig {
  return {
    configuration: Configurations.Laptop.latest(loggerFactory)
      .withClientTimeoutMillis(90000)
      .withMiddlewares(middleware),
    credentialProvider: credsProvider(),
    defaultTtlSeconds: 1111,
  };
}
