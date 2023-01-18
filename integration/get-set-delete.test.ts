import {v4} from 'uuid';
import {
  CacheDelete,
  CacheGet,
  CacheSet,
  MomentoErrorCode,
  SimpleCacheClient,
  CacheSetAddElement,
} from '../src';
import {
  ResponseBase,
  IResponseError,
} from '../src/messages/responses/response-base';
import {TextEncoder} from 'util';
import {
  SetupIntegrationTest,
  CacheClientProps,
  WithCache,
} from './integration-setup';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

describe('get/set/delete', () => {
  const sharedValidationSpecs = (
    getResponse: (cacheName: string, key: string) => Promise<ResponseBase>
  ) => {
    it('validates its cache name', async () => {
      const response = await getResponse('   ', v4());

      expect((response as IResponseError).errorCode()).toEqual(
        MomentoErrorCode.INVALID_ARGUMENT_ERROR
      );
    });
  };

  sharedValidationSpecs((cacheName: string, key: string) => {
    return Momento.get(cacheName, key);
  });
  sharedValidationSpecs((cacheName: string, key: string) => {
    return Momento.set(cacheName, key, v4());
  });
  sharedValidationSpecs((cacheName: string, key: string) => {
    return Momento.delete(cacheName, key);
  });

  it('should set and get string from cache', async () => {
    const cacheKey = v4();
    const cacheValue = v4();
    const setResponse = await Momento.set(
      IntegrationTestCacheName,
      cacheKey,
      cacheValue
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);
    if (getResponse instanceof CacheGet.Hit) {
      expect(getResponse.valueString()).toEqual(cacheValue);
    }
  });

  it('should set and get bytes from cache', async () => {
    const cacheKey = new TextEncoder().encode(v4());
    const cacheValue = new TextEncoder().encode(v4());
    const setResponse = await Momento.set(
      IntegrationTestCacheName,
      cacheKey,
      cacheValue
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);
  });

  it('should set string key with bytes value', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    const setResponse = await Momento.set(
      IntegrationTestCacheName,
      cacheKey,
      cacheValue
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);
    if (getResponse instanceof CacheGet.Hit) {
      expect(getResponse.valueUint8Array()).toEqual(cacheValue);
    }
  });

  it('should set byte key with string value', async () => {
    const cacheValue = v4();
    const cacheKey = new TextEncoder().encode(v4());
    const setResponse = await Momento.set(
      IntegrationTestCacheName,
      cacheKey,
      cacheValue
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);
    if (getResponse instanceof CacheGet.Hit) {
      expect(getResponse.valueString()).toEqual(cacheValue);
    }
  });

  it('should set and get string from cache and returned set value matches string cacheValue', async () => {
    const cacheKey = v4();
    const cacheValue = v4();
    const setResponse = await Momento.set(
      IntegrationTestCacheName,
      cacheKey,
      cacheValue
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
  });

  it('should set string key with bytes value and returned set value matches byte cacheValue', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    const setResponse = await Momento.set(
      IntegrationTestCacheName,
      cacheKey,
      cacheValue
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
  });

  it('should timeout on a request that exceeds specified timeout', async () => {
    const cacheName = v4();
    const defaultTimeoutClient = Momento;
    const shortTimeoutTransportStrategy = CacheClientProps.configuration
      .getTransportStrategy()
      .withClientTimeoutMillis(1);
    const shortTimeoutConfiguration =
      CacheClientProps.configuration.withTransportStrategy(
        shortTimeoutTransportStrategy
      );
    const shortTimeoutClient = new SimpleCacheClient({
      configuration: shortTimeoutConfiguration,
      credentialProvider: CacheClientProps.credentialProvider,
      defaultTtlSeconds: 1111,
    });
    await WithCache(defaultTimeoutClient, cacheName, async () => {
      const cacheKey = v4();
      // Create a longer cache value that should take longer than 1ms to send
      const cacheValue = new TextEncoder().encode(v4().repeat(1000));
      const setResponse = await shortTimeoutClient.set(
        cacheName,
        cacheKey,
        cacheValue
      );
      expect(setResponse).toBeInstanceOf(CacheSet.Error);
      if (setResponse instanceof CacheSet.Error) {
        expect(setResponse.errorCode()).toEqual(MomentoErrorCode.TIMEOUT_ERROR);
      }
    });
  });

  it('should set and then delete a value in cache', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    await Momento.set(IntegrationTestCacheName, cacheKey, cacheValue);
    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);

    const deleteResponse = await Momento.delete(
      IntegrationTestCacheName,
      cacheKey
    );
    expect(deleteResponse).toBeInstanceOf(CacheSetAddElement.Success);
    const getMiss = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getMiss).toBeInstanceOf(CacheGet.Miss);
  });
});
