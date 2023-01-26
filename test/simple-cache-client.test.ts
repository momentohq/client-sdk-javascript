import {
  Configurations,
  InvalidArgumentError,
  SimpleCacheClient,
  EnvMomentoTokenProvider,
} from '../src';
import * as CreateCache from '../src/messages/responses/create-cache';
const credentialProvider = new EnvMomentoTokenProvider({
  environmentVariableName: 'TEST_AUTH_TOKEN',
});
const configuration = Configurations.Laptop.latest();

describe('SimpleCacheClient.ts', () => {
  it('cannot create/get cache with invalid name', async () => {
    const invalidCacheNames = ['', '    '];
    const momento = new SimpleCacheClient({
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
      new SimpleCacheClient({
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
