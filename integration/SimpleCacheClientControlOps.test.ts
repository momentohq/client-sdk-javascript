import {v4} from 'uuid';
import {SimpleCacheClient, TimeoutError} from '../src';
import {TextEncoder} from 'util';

const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;
if (!AUTH_TOKEN) {
  throw new Error('Missing required env var TEST_AUTH_TOKEN');
}
const INTEGRATION_TEST_CACHE_NAME =
  process.env.TEST_CACHE_NAME || 'control-ops-cache';

describe('SimpleCacheClient.ts Integration Tests - create, list, and delete cache', () => {
  let momento: SimpleCacheClient;
  let cacheName: string;
  beforeAll(async () => {
    cacheName = v4();
    momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    await momento.createCache(cacheName);
  });
  afterAll(async () => {
    await momento.deleteCache(cacheName);
  });
  it('should create and delete a cache', async () => {
    await momento.set(cacheName, 'key', 'value');
    const res = await momento.get(cacheName, 'key');
    expect(res.text()).toEqual('value');
  });

  it('should list the created cache', async () => {
    const caches = (await momento.listCaches()).getCaches();
    const names = caches.map(c => c.getName());
    expect(names.includes(cacheName)).toBeTruthy();
  });
});

describe('SimpleCacheClient.ts Integration Tests - short deadline for connection', () => {
  let momento: SimpleCacheClient;
  beforeAll(async () => {
    momento = new SimpleCacheClient(AUTH_TOKEN, 1111, 1);
    await momento.createCache(INTEGRATION_TEST_CACHE_NAME);
  });
  afterAll(async () => {
    await momento.deleteCache(INTEGRATION_TEST_CACHE_NAME);
  });
  it('should terminate connection for a short deadline', async () => {
    const cacheKey = v4();
    // Create a longer cache value that should take longer than 1ms to send
    const cacheValue = new TextEncoder().encode(v4().repeat(10));
    await expect(
      momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue)
    ).rejects.toThrow(TimeoutError);
  });
});
