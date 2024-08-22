import {credsProvider} from '../integration-setup';
import {CacheClientAllProps} from '../../../src/internal/cache-client-all-props';
import {
  CacheClient,
  Configurations,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
  MiddlewareFactory,
} from '../../../src';

describe("Test exercises closing a client and jest doesn't hang", () => {
  it('constructs a client with background task and closes it', async () => {
    let client;
    try {
      client = await CacheClient.create(
        integrationTestCacheClientPropsWithExperimentalMetricsMiddleware()
      );
    } finally {
      if (client) client.close();
    }
  });
});

function integrationTestCacheClientPropsWithExperimentalMetricsMiddleware(): CacheClientAllProps {
  const loggerFactory = new DefaultMomentoLoggerFactory(
    DefaultMomentoLoggerLevel.INFO
  );
  return {
    configuration: Configurations.Laptop.latest(loggerFactory)
      .withClientTimeoutMillis(90000)
      .withMiddlewares(
        MiddlewareFactory.createMetricsMiddlewares(loggerFactory, {
          eventLoopMetricsLog: true,
          garbageCollectionMetricsLog: true,
          activeRequestCountMetricsLog: true,
        })
      ),
    credentialProvider: credsProvider(),
    defaultTtlSeconds: 1111,
  };
}
