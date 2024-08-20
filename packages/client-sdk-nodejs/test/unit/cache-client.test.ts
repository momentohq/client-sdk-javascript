import {
  Configurations,
  InvalidArgumentError,
  CacheClient,
  SimpleCacheClient,
  CreateCache,
  StringMomentoTokenProvider,
} from '../../src';
import {SimpleCacheClientProps} from '../../src/cache-client-props';

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
    const momento = new CacheClient({
      configuration: configuration,
      credentialProvider: credentialProvider,
      defaultTtlSeconds: 100,
    });
    for (const name of invalidCacheNames) {
      const createResponse = await momento.createCache(name);
      console.error(`CREATE RESPONSE: ${createResponse.toString()}`);
      expect(createResponse).toBeInstanceOf(CreateCache.Error);
      if (createResponse instanceof CreateCache.Error) {
        expect(createResponse.innerException()).toBeInstanceOf(
          InvalidArgumentError
        );
      }
    }
  });
  it('cannot create a client with an invalid request timeout', () => {
    try {
      const invalidTimeoutConfig = configuration.withTransportStrategy(
        configuration.getTransportStrategy().withClientTimeoutMillis(-1)
      );
      new CacheClient({
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
  it('cannot create a client with an invalid default TTL', () => {
    try {
      new CacheClient({
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
      new CacheClient({
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
  it('cannot create a client with concurrent requests limit below 1', () => {
    try {
      const negativeLimitConfig = configuration.withTransportStrategy(
        configuration.getTransportStrategy().withMaxConcurrentRequests(-1)
      );
      new CacheClient({
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
      new CacheClient({
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
