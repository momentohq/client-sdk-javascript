import {credsProvider} from './integration-setup';
import {CacheClientPropsWithConfig} from '../../src/internal/cache-client-props-with-config';
import {
  CacheClient,
  Configurations,
  CredentialProvider,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
  MiddlewareFactory,
  MomentoErrorCode,
} from '../../src';
import {ConnectionError} from '@gomomento/sdk-core';

const fakeAuthTokenForTesting =
  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzcXVpcnJlbCIsImNwIjoiY29udHJvbCBwbGFuZSBlbmRwb2ludCIsImMiOiJkYXRhIHBsYW5lIGVuZHBvaW50In0.zsTsEXFawetTCZI';

describe('Cache client construction behaviors and tests', () => {
  it('createClient with background task and closes it', () => {
    const client = new CacheClient(
      integrationTestCacheClientPropsWithExperimentalMetricsMiddleware()
    );
    client.close();
  });
  it('createWithEagerConnection throws if it cannot connect', async () => {
    let client;
    try {
      client = await CacheClient.create({
        configuration: Configurations.Laptop.latest(),
        // fake auth token will prevent eager connection from taking place
        credentialProvider: CredentialProvider.fromString(
          fakeAuthTokenForTesting
        ),
        defaultTtlSeconds: 100,
      });
      // If the function call above does not throw, explicitly fail the test.
      expect('Expected error was not thrown').toBeUndefined();
    } catch (e) {
      if (e instanceof ConnectionError) {
        // Now TypeScript knows 'e' is an Error, so 'message' is accessible.
        expect(e._errorCode).toEqual(MomentoErrorCode.CONNECTION_ERROR);
        expect(e.message).toContain('Unable to connect to Momento');
      } else {
        // Handle the case where 'e' is not an Error object.
        expect('Error is not an instance of Error').toBeUndefined();
      }
    } finally {
      if (client) client.close();
    }
  });
});

function integrationTestCacheClientPropsWithExperimentalMetricsMiddleware(): CacheClientPropsWithConfig {
  const loggerFactory = new DefaultMomentoLoggerFactory(
    DefaultMomentoLoggerLevel.INFO
  );
  return {
    configuration: Configurations.Laptop.latest(loggerFactory)
      .withClientTimeoutMillis(90000)
      .withMiddlewares(
        MiddlewareFactory.createMetricsMiddlewares(loggerFactory, {
          eventLoopMetricsLog: true,
          activeRequestCountMetricsLog: true,
        })
      ),
    credentialProvider: credsProvider(),
    defaultTtlSeconds: 1111,
  };
}
