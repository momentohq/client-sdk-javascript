import {v4} from 'uuid';
import {TextEncoder} from 'util';
import {Momento, MomentoCache} from '../src';

const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;
if (!AUTH_TOKEN) {
  throw new Error('Missing required env var TEST_AUTH_TOKEN');
}
const CACHE_NAME = process.env.TEST_CACHE_NAME || 'dummy';

describe('MomentoCache.ts Integration Tests', () => {
  let cache: MomentoCache;
  let momento: Momento;
  beforeAll(async () => {
    momento = new Momento(AUTH_TOKEN);
    cache = await momento.createOrGetCache(CACHE_NAME, {
      defaultTtlSeconds: 100,
    });
  });

  it('should set and get string from cache', async () => {
    const cacheKey = v4();
    const cacheValue = v4();
    await cache.set(cacheKey, cacheValue);
    const res = await cache.get(cacheKey);
    expect(res.text()).toEqual(cacheValue);
  });
  it('should set and get bytes from cache', async () => {
    const cacheKey = new TextEncoder().encode(v4());
    const cacheValue = new TextEncoder().encode(v4());
    await cache.set(cacheKey, cacheValue);
    const res = await cache.get(cacheKey);
    expect(res.bytes()).toEqual(cacheValue);
  });
  it('should set string key with bytes value', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    await cache.set(cacheKey, cacheValue);
    const res = await cache.get(cacheKey);
    expect(res.bytes()).toEqual(cacheValue);
  });
  it('should set byte key with string value', async () => {
    const cacheValue = v4();
    const cacheKey = new TextEncoder().encode(v4());
    await cache.set(cacheKey, cacheValue);
    const res = await cache.get(cacheKey);
    expect(res.bytes()).toEqual(cacheValue);
  });
});
