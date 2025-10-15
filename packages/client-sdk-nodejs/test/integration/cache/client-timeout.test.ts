import {v4} from 'uuid';
import {testCacheName} from '@gomomento/common-integration-tests';
import {
  CacheSet,
  CacheSetIfNotExists,
  MomentoErrorCode,
  CacheClient,
} from '../../../src';
import {TextEncoder} from 'util';
import {
  SetupIntegrationTest,
  integrationTestCacheClientProps,
  WithCache,
} from '../integration-setup';

const {cacheClient} = SetupIntegrationTest();

// TODO: these tests are only applicable to the nodejs CacheClient at the moment. Once the
//  Web SDK supports the full Configuration interface, these tests should be moved into the
//  get-set-delete file in the common-integration-tests package.
describe('client timeout tests', () => {
  it('should timeout on a set request that exceeds specified timeout', async () => {
    const cacheName = testCacheName();
    const defaultTimeoutClient = cacheClient;
    const shortTimeoutTransportStrategy = integrationTestCacheClientProps()
      .configuration.getTransportStrategy()
      .withClientTimeoutMillis(1);
    const shortTimeoutConfiguration =
      integrationTestCacheClientProps().configuration.withTransportStrategy(
        shortTimeoutTransportStrategy
      );
    const shortTimeoutClient = new CacheClient({
      configuration: shortTimeoutConfiguration,
      credentialProvider: integrationTestCacheClientProps().credentialProvider,
      defaultTtlSeconds: 1111,
    });
    await WithCache(defaultTimeoutClient, cacheName, async () => {
      const cacheKey = v4();
      // Create a 1mb cache value that should take longer than 1ms to send
      const cacheValue = new TextEncoder().encode('x'.repeat(1_000_000));
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

  it('should timeout on a setIfNotExists request that exceeds specified timeout', async () => {
    const cacheName = testCacheName();
    const defaultTimeoutClient = cacheClient;
    const shortTimeoutTransportStrategy = integrationTestCacheClientProps()
      .configuration.getTransportStrategy()
      .withClientTimeoutMillis(1);
    const shortTimeoutConfiguration =
      integrationTestCacheClientProps().configuration.withTransportStrategy(
        shortTimeoutTransportStrategy
      );
    const shortTimeoutClient = new CacheClient({
      configuration: shortTimeoutConfiguration,
      credentialProvider: integrationTestCacheClientProps().credentialProvider,
      defaultTtlSeconds: 1111,
    });
    await WithCache(defaultTimeoutClient, cacheName, async () => {
      const cacheKey = v4();
      // Create a 1mb cache value that should take longer than 1ms to send
      const cacheValue = new TextEncoder().encode('x'.repeat(1_000_000));
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
});
