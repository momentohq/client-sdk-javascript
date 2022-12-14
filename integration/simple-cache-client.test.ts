// import {v4} from 'uuid';
// import {
//   CacheGetStatus,
//   SimpleCacheClient,
//   TimeoutError,
//   AlreadyExistsError,
//   NotFoundError,
// } from '../src';
// import {TextEncoder} from 'util';
//
// const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;
// if (!AUTH_TOKEN) {
//   throw new Error('Missing required env var TEST_AUTH_TOKEN');
// }
// const INTEGRATION_TEST_CACHE_NAME =
//   process.env.TEST_CACHE_NAME || 'js-integration-test-default';
//
// const deleteCacheIfExists = async (
//   momento: SimpleCacheClient,
//   cacheName: string
// ) => {
//   try {
//     await momento.deleteCache(cacheName);
//   } catch (e) {
//     if (!(e instanceof NotFoundError)) {
//       throw e;
//     }
//   }
// };
//
// beforeAll(async () => {
//   const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
//   await deleteCacheIfExists(momento, INTEGRATION_TEST_CACHE_NAME);
//   await momento.createCache(INTEGRATION_TEST_CACHE_NAME);
// });
//
// afterAll(async () => {
//   const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
//   await momento.deleteCache(INTEGRATION_TEST_CACHE_NAME);
// });
//
// async function withCache(
//   client: SimpleCacheClient,
//   cacheName: string,
//   block: () => Promise<void>
// ) {
//   await deleteCacheIfExists(client, cacheName);
//   await client.createCache(cacheName);
//   try {
//     await block();
//   } finally {
//     await deleteCacheIfExists(client, cacheName);
//   }
// }
//
// describe('SimpleCacheClient.ts Integration Tests', () => {
//   it('should create and delete a cache', async () => {
//     const cacheName = v4();
//     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
//     await withCache(momento, cacheName, async () => {
//       await momento.set(cacheName, 'key', 'value');
//       const res = await momento.get(cacheName, 'key');
//       expect(res.text()).toEqual('value');
//     });
//   });
//   it('should throw CacheNotFoundError if deleting a non-existent cache', async () => {
//     const cacheName = v4();
//     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
//     await expect(momento.deleteCache(cacheName)).rejects.toThrow(NotFoundError);
//   });
//   it('should throw CacheAlreadyExistsError if trying to create a cache that already exists', async () => {
//     const cacheName = v4();
//     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
//     await withCache(momento, cacheName, async () => {
//       await expect(momento.createCache(cacheName)).rejects.toThrow(
//         AlreadyExistsError
//       );
//     });
//   });
//
//   it('should create 1 cache and list the created cache', async () => {
//     const cacheName = v4();
//     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
//     await withCache(momento, cacheName, async () => {
//       const caches = (await momento.listCaches()).getCaches();
//       const names = caches.map(c => c.getName());
//       expect(names.includes(cacheName)).toBeTruthy();
//     });
//   });
//
//   it('should set and get string from cache', async () => {
//     const cacheKey = v4();
//     const cacheValue = v4();
//     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
//     await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
//     const res = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
//     expect(res.text()).toEqual(cacheValue);
//   });
//   it('should set and get bytes from cache', async () => {
//     const cacheKey = new TextEncoder().encode(v4());
//     const cacheValue = new TextEncoder().encode(v4());
//     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
//     await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
//     const res = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
//     expect(res.bytes()).toEqual(cacheValue);
//   });
//   it('should set string key with bytes value', async () => {
//     const cacheKey = v4();
//     const cacheValue = new TextEncoder().encode(v4());
//     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
//     await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
//     const res = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
//     expect(res.bytes()).toEqual(cacheValue);
//   });
//   it('should set byte key with string value', async () => {
//     const cacheValue = v4();
//     const cacheKey = new TextEncoder().encode(v4());
//     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
//     await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
//     const res = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
//     expect(res.text()).toEqual(cacheValue);
//   });
//   it('should set and get string from cache and returned set value matches string cacheValue', async () => {
//     const cacheKey = v4();
//     const cacheValue = v4();
//     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
//     const setResult = await momento.set(
//       INTEGRATION_TEST_CACHE_NAME,
//       cacheKey,
//       cacheValue
//     );
//     expect(setResult.text()).toEqual(cacheValue);
//   });
//   it('should set string key with bytes value and returned set value matches byte cacheValue', async () => {
//     const cacheKey = v4();
//     const cacheValue = new TextEncoder().encode(v4());
//     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
//     const setResult = await momento.set(
//       INTEGRATION_TEST_CACHE_NAME,
//       cacheKey,
//       cacheValue
//     );
//     expect(setResult.bytes()).toEqual(cacheValue);
//   });
//   it('should timeout on a request that exceeds specified timeout', async () => {
//     const cacheName = v4();
//     const defaultTimeoutClient = new SimpleCacheClient(AUTH_TOKEN, 1111);
//     const shortTimeoutClient = new SimpleCacheClient(AUTH_TOKEN, 1111, {
//       requestTimeoutMs: 1,
//     });
//     await withCache(defaultTimeoutClient, cacheName, async () => {
//       const cacheKey = v4();
//       // Create a longer cache value that should take longer than 1ms to send
//       const cacheValue = new TextEncoder().encode(v4().repeat(1000));
//       await expect(
//         shortTimeoutClient.set(cacheName, cacheKey, cacheValue)
//       ).rejects.toThrow(TimeoutError);
//     });
//   });
//   it('should set and then delete a value in cache', async () => {
//     const cacheKey = v4();
//     const cacheValue = new TextEncoder().encode(v4());
//     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
//     await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
//     const getSuccess = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
//     // validate set worked correctly
//     expect(getSuccess.bytes()).toEqual(cacheValue);
//
//     await momento.delete(INTEGRATION_TEST_CACHE_NAME, cacheKey);
//     const getMiss = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
//     expect(getMiss.status).toEqual(CacheGetStatus.Miss);
//   });
//   it('should create, list, and revoke a signing key', async () => {
//     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
//     const createSigningKeyResponse = await momento.createSigningKey(30);
//     let listSigningKeysResponse = await momento.listSigningKeys();
//     let signingKeys = listSigningKeysResponse.getSigningKeys();
//     expect(signingKeys.length).toBeGreaterThan(0);
//     expect(
//       signingKeys
//         .map(k => k.getKeyId())
//         .some(k => k === createSigningKeyResponse.getKeyId())
//     ).toEqual(true);
//     await momento.revokeSigningKey(createSigningKeyResponse.getKeyId());
//     listSigningKeysResponse = await momento.listSigningKeys();
//     signingKeys = listSigningKeysResponse.getSigningKeys();
//     expect(
//       signingKeys
//         .map(k => k.getKeyId())
//         .some(k => k === createSigningKeyResponse.getKeyId())
//     ).toEqual(false);
//   });
// });
