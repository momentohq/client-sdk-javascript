import {v4} from 'uuid';
import {
  CacheDelete,
  CacheGet,
  CacheSet,
  MomentoErrorCode,
  SimpleCacheClient,
} from '../src';
import {TextEncoder} from 'util';
import {
  SetupIntegrationTest,
  ValidateCacheProps,
  CacheClientProps,
  ItBehavesLikeItValidatesCacheName,
  WithCache,
} from './integration-setup';
import {sleep} from "../src/internal/utils/sleep";

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

describe('get/set/delete', () => {
  ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
    return Momento.get(props.cacheName, v4());
  });
  ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
    return Momento.set(props.cacheName, v4(), v4());
  });
  ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
    return Momento.delete(props.cacheName, v4());
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
    expect(deleteResponse).toBeInstanceOf(CacheDelete.Success);
    const getMiss = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getMiss).toBeInstanceOf(CacheGet.Miss);
  });

  it('should return INVALID_ARGUMENT_ERROR for invalid ttl when set with string key/value', async () => {
    const setResponse = await Momento.set(
      IntegrationTestCacheName,
      v4(),
      v4(),
      {ttl: -1}
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Error);
    if (setResponse instanceof CacheSet.Error) {
      expect(setResponse.errorCode()).toEqual(
        MomentoErrorCode.INVALID_ARGUMENT_ERROR
      );
    }
  });

  it('should return INVALID_ARGUMENT_ERROR for invalid ttl when set with byte key/value', async () => {
    const setResponse = await Momento.set(
      IntegrationTestCacheName,
      new TextEncoder().encode(v4()),
      new TextEncoder().encode(v4()),
      {ttl: -1}
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Error);
    if (setResponse instanceof CacheSet.Error) {
      expect(setResponse.errorCode()).toEqual(
        MomentoErrorCode.INVALID_ARGUMENT_ERROR
      );
    }
  });

  it('should set string key/value with valid ttl and get successfully', async () => {
    const cacheKey = v4();
    const cacheValue = v4();
    const setResponse = await Momento.set(
      IntegrationTestCacheName,
      cacheKey,
      cacheValue,
      {ttl: 15}
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Success);

    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    if (getResponse instanceof CacheGet.Hit) {
      expect(getResponse.valueString()).toEqual(cacheValue);
    }
  });

  it('should set byte key/value with valid ttl and get successfully', async () => {
    const cacheKey = new TextEncoder().encode(v4());
    const cacheValue = new TextEncoder().encode(v4());
    const setResponse = await Momento.set(
      IntegrationTestCacheName,
      cacheKey,
      cacheValue,
      {ttl: 15}
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Success);

    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    if (getResponse instanceof CacheGet.Hit) {
      expect(getResponse.valueUint8Array()).toEqual(cacheValue);
    }
  });

  it('should set with valid ttl and should return miss when ttl is expired', async () => {
    const cacheKey = v4();
    const setResponse = await Momento.set(
      IntegrationTestCacheName,
      cacheKey,
      v4(),
      {ttl: 1}
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
    await sleep(3000);

    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Miss);
  });
});
