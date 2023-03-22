import {
  Configurations,
  InvalidArgumentError,
  CacheClient,
  SimpleCacheClient,
  CreateCache,
} from '../../src';
import {StringMomentoTokenProvider} from '@gomomento/common/dist/src/auth';
import {SimpleCacheClientProps} from '../../src/cache-client-props';
const credentialProvider = new StringMomentoTokenProvider({
  authToken:
    'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzcXVpcnJlbCIsImNwIjoiY29udHJvbCBwbGFuZSBlbmRwb2ludCIsImMiOiJkYXRhIHBsYW5lIGVuZHBvaW50In0.zsTsEXFawetTCZI',
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
});
