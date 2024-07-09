import {
  Configurations,
  InvalidArgumentError,
  CacheClient,
  SimpleCacheClient,
  CreateCache,
  StringMomentoTokenProvider,
  CredentialProvider,
  MomentoErrorCode,
} from '../../src';
import {SimpleCacheClientProps} from '../../src/cache-client-props';
import {ConnectionError} from '@gomomento/sdk-core';

// This auth token is syntactically correct but not actually valid; it won't work with the real Momento Servers.
// Used only for unit testing the constructors etc.
const fakeAuthTokenForTesting =
  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzcXVpcnJlbCIsImNwIjoiY29udHJvbCBwbGFuZSBlbmRwb2ludCIsImMiOiJkYXRhIHBsYW5lIGVuZHBvaW50In0.zsTsEXFawetTCZI';
const credentialProvider = new StringMomentoTokenProvider({
  authToken: fakeAuthTokenForTesting,
});
const configuration = Configurations.Laptop.latest();

describe('CacheClient', () => {
  it('can construct a CacheClient with the legacy class name SimpleCacheClient', () => {
    const props: SimpleCacheClientProps = {
      configuration: configuration,
      credentialProvider: credentialProvider,
      defaultTtlSeconds: 100,
    };
    new SimpleCacheClient(props);
  });

  it('cannot create/get cache with invalid name', async () => {
    const invalidCacheNames = ['', '    '];
    const momento = await CacheClient.create({
      configuration: configuration,
      credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
      defaultTtlSeconds: 100,
    });
    for (const name of invalidCacheNames) {
      const createResponse = await momento.createCache(name);
      expect(createResponse).toBeInstanceOf(CreateCache.Error);
      if (createResponse instanceof CreateCache.Error) {
        expect(createResponse.innerException()).toBeInstanceOf(
          InvalidArgumentError
        );
      }
    }
  });
  it('cannot create a client with an invalid request timeout', async () => {
    try {
      const invalidTimeoutConfig = configuration.withTransportStrategy(
        configuration.getTransportStrategy().withClientTimeoutMillis(-1)
      );
      await CacheClient.create({
        configuration: invalidTimeoutConfig,
        credentialProvider: credentialProvider,
        defaultTtlSeconds: 100,
      });
      fail(new Error('Expected InvalidArgumentError to be thrown!'));
    } catch (e) {
      if (!(e instanceof InvalidArgumentError)) {
        fail(new Error('Expected InvalidArgumentError to be thrown!'));
      }
    }
  });
  it('createWithEagerConnection throws if it cannot connect', async () => {
    try {
      await CacheClient.create({
        configuration: configuration,
        credentialProvider: credentialProvider,
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
    }
  });
  it('cannot create a client with an invalid default TTL', async () => {
    try {
      await CacheClient.create({
        configuration: configuration,
        credentialProvider: credentialProvider,
        defaultTtlSeconds: -100,
      });
      fail(new Error('Expected InvalidArgumentError to be thrown!'));
    } catch (e) {
      if (!(e instanceof InvalidArgumentError)) {
        fail(new Error('Expected InvalidArgumentError to be thrown!'));
      }
    }

    try {
      await CacheClient.create({
        configuration: configuration,
        credentialProvider: credentialProvider,
        defaultTtlSeconds: 10.5,
      });
      fail(new Error('Expected InvalidArgumentError to be thrown!'));
    } catch (e) {
      if (!(e instanceof InvalidArgumentError)) {
        fail(new Error('Expected InvalidArgumentError to be thrown!'));
      }
    }
  });
  it('cannot create a client with concurrent requests limit below 1', async () => {
    try {
      const negativeLimitConfig = configuration.withTransportStrategy(
        configuration.getTransportStrategy().withMaxConcurrentRequests(-1)
      );
      await CacheClient.create({
        configuration: negativeLimitConfig,
        credentialProvider: credentialProvider,
        defaultTtlSeconds: 100,
      });
      fail(new Error('Expected InvalidArgumentError to be thrown!'));
    } catch (e) {
      if (!(e instanceof InvalidArgumentError)) {
        fail(new Error('Expected InvalidArgumentError to be thrown!'));
      }
    }

    try {
      const zeroLimitConfig = configuration.withTransportStrategy(
        configuration.getTransportStrategy().withMaxConcurrentRequests(0)
      );
      await CacheClient.create({
        configuration: zeroLimitConfig,
        credentialProvider: credentialProvider,
        defaultTtlSeconds: 100,
      });
      fail(new Error('Expected InvalidArgumentError to be thrown!'));
    } catch (e) {
      if (!(e instanceof InvalidArgumentError)) {
        fail(new Error('Expected InvalidArgumentError to be thrown!'));
      }
    }
  });
});
