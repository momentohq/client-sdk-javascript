import {
  Configurations,
  InvalidArgumentError,
  CacheClient,
  SimpleCacheClient,
  CreateCache,
  StringMomentoTokenProvider,
} from '../../src';
import {SimpleCacheClientProps} from '../../src/cache-client-props';
import {CacheSet, ServerUnavailableError} from '@gomomento/sdk-core';

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
      credentialProvider: credentialProvider,
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
  it('createWithEagerConnection returns a client even if it cannot connect', async () => {
    const momento = await CacheClient.create({
      configuration: configuration,
      credentialProvider: credentialProvider,
      defaultTtlSeconds: 100,
      eagerConnectTimeout: 1000,
    });
    const setResponse = await momento.set('cache', 'key', 'value');
    expect(setResponse).toBeInstanceOf(CacheSet.Error);
    if (setResponse instanceof CacheSet.Error) {
      expect(setResponse.innerException()).toBeInstanceOf(
        ServerUnavailableError
      );
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
});
