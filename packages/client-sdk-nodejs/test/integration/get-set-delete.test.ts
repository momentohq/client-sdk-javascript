import {v4} from 'uuid';
import {
  CacheSet,
  CacheSetIfNotExists,
  MomentoErrorCode,
  CacheClient,
  CacheGet,
} from '../../src';
import {TextEncoder} from 'util';
import {
  SetupIntegrationTest,
  IntegrationTestCacheClientProps,
  WithCache,
  testCacheName,
} from './integration-setup';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

describe('get/set/delete', () => {
  it('should timeout on a request that exceeds specified timeout', async () => {
    const cacheName = testCacheName();
    const defaultTimeoutClient = Momento;
    const shortTimeoutTransportStrategy =
      IntegrationTestCacheClientProps.configuration
        .getTransportStrategy()
        .withClientTimeoutMillis(1);
    const shortTimeoutConfiguration =
      IntegrationTestCacheClientProps.configuration.withTransportStrategy(
        shortTimeoutTransportStrategy
      );
    const shortTimeoutClient = new CacheClient({
      configuration: shortTimeoutConfiguration,
      credentialProvider: IntegrationTestCacheClientProps.credentialProvider,
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

  it('should timeout on a request that exceeds specified timeout', async () => {
    const cacheName = testCacheName();
    const defaultTimeoutClient = Momento;
    const shortTimeoutTransportStrategy =
      IntegrationTestCacheClientProps.configuration
        .getTransportStrategy()
        .withClientTimeoutMillis(1);
    const shortTimeoutConfiguration =
      IntegrationTestCacheClientProps.configuration.withTransportStrategy(
        shortTimeoutTransportStrategy
      );
    const shortTimeoutClient = new CacheClient({
      configuration: shortTimeoutConfiguration,
      credentialProvider: IntegrationTestCacheClientProps.credentialProvider,
      defaultTtlSeconds: 1111,
    });
    await WithCache(defaultTimeoutClient, cacheName, async () => {
      const cacheKey = v4();
      // Create a longer cache value that should take longer than 1ms to send
      const cacheValue = new TextEncoder().encode(v4().repeat(1000));
      const setResponse = await shortTimeoutClient.setIfNotExists(
        cacheName,
        cacheKey,
        cacheValue
      );
      expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Error);
      if (setResponse instanceof CacheSetIfNotExists.Error) {
        expect(setResponse.errorCode()).toEqual(MomentoErrorCode.TIMEOUT_ERROR);
      }
    });
  });

  it('should set string key with bytes value', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    const setResponse = await Momento.set(
      IntegrationTestCacheName,
      cacheKey,
      cacheValue
    );
    expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);
    if (getResponse instanceof CacheGet.Hit) {
      expect(getResponse.valueUint8Array()).toEqual(cacheValue);
    }
  });

  it('should setIfNotExists string key with bytes value', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    const setResponse = await Momento.setIfNotExists(
      IntegrationTestCacheName,
      cacheKey,
      cacheValue
    );
    expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);
    if (getResponse instanceof CacheGet.Hit) {
      expect(getResponse.valueUint8Array()).toEqual(cacheValue);
    }
  });
});
