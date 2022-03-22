import {v4} from 'uuid';
import {SimpleCacheClient} from '../src';

const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;
if (!AUTH_TOKEN) {
  throw new Error('Missing required env var TEST_AUTH_TOKEN');
}
const INTEGRATION_TEST_CACHE_NAME =
  process.env.TEST_CACHE_NAME || 'data-ops-cache';

describe('SimpleCacheClient.ts Integration Tests - various sets and gets', () => {
  test('should set and get string from cache', async () => {
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    await momento.createCache(INTEGRATION_TEST_CACHE_NAME);
    const cacheKey = v4();
    const cacheValue = v4();
    await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
    const res = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
    expect(res.text()).toEqual(cacheValue);
    await momento.deleteCache(INTEGRATION_TEST_CACHE_NAME);
  });
  //   it('should set and get bytes from cache', async () => {
  //     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
  //     await momento.createCache(INTEGRATION_TEST_CACHE_NAME);
  //     const cacheKey = new TextEncoder().encode(v4());
  //     const cacheValue = new TextEncoder().encode(v4());
  //     await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
  //     const res = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
  //     expect(res.bytes()).toEqual(cacheValue);
  //     await momento.deleteCache(INTEGRATION_TEST_CACHE_NAME);
  //   });
  //   it('should set string key with bytes value', async () => {
  //     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
  //     await momento.createCache(INTEGRATION_TEST_CACHE_NAME);
  //     const cacheKey = v4();
  //     const cacheValue = new TextEncoder().encode(v4());
  //     await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
  //     const res = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
  //     expect(res.bytes()).toEqual(cacheValue);
  //     await momento.deleteCache(INTEGRATION_TEST_CACHE_NAME);
  //   });
  //   it('should set byte key with string value', async () => {
  //     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
  //     await momento.createCache(INTEGRATION_TEST_CACHE_NAME);
  //     const cacheValue = v4();
  //     const cacheKey = new TextEncoder().encode(v4());
  //     await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
  //     const res = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
  //     expect(res.text()).toEqual(cacheValue);
  //   });
  //   it('should set and get string from cache and returned set value matches string cacheValue', async () => {
  //     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
  //     await momento.createCache(INTEGRATION_TEST_CACHE_NAME);
  //     const cacheKey = v4();
  //     const cacheValue = v4();
  //     const setResult = await momento.set(
  //       INTEGRATION_TEST_CACHE_NAME,
  //       cacheKey,
  //       cacheValue
  //     );
  //     expect(setResult.text()).toEqual(cacheValue);
  //     await momento.deleteCache(INTEGRATION_TEST_CACHE_NAME);
  //   });
  //   it('should set string key with bytes value and returned set value matches byte cacheValue', async () => {
  //     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
  //     await momento.createCache(INTEGRATION_TEST_CACHE_NAME);
  //     const cacheKey = v4();
  //     const cacheValue = new TextEncoder().encode(v4());
  //     const setResult = await momento.set(
  //       INTEGRATION_TEST_CACHE_NAME,
  //       cacheKey,
  //       cacheValue
  //     );
  //     expect(setResult.bytes()).toEqual(cacheValue);
  //     await momento.deleteCache(INTEGRATION_TEST_CACHE_NAME);
  //   });
});
