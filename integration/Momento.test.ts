import {v4} from 'uuid';
import {Momento} from '../src';
import {CacheAlreadyExistsError, CacheNotFoundError} from '../src/Errors';

const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;
if (!AUTH_TOKEN) {
  throw new Error('Missing required env var TEST_AUTH_TOKEN');
}

describe('Momento.ts Integration Tests', () => {
  it('should create and delete a cache', async () => {
    const cacheName = v4();
    const momento = new Momento(AUTH_TOKEN);
    await momento.createCache(cacheName);
    momento.getCache(cacheName, {defaultTtlSeconds: 10});
    // FIXME https://github.com/momentohq/cacheadmin-v2/issues/107
    // await momento.deleteCache(cacheName);
  });
  // FIXME https://github.com/momentohq/cacheadmin-v2/issues/107
  // it('should throw CacheNotFoundError if deleting a non-existent cache', async () => {
  //   const cacheName = v4();
  //   const momento = new Momento(AUTH_TOKEN);
  //   // await expect(momento.deleteCache(cacheName)).rejects.toThrow(
  //   //   CacheNotFoundError
  //   // );
  // });
  it('should throw CacheAlreadyExistsError if trying to create a cache that already exists', async () => {
    const cacheName = v4();
    const momento = new Momento(AUTH_TOKEN);
    await momento.createCache(cacheName);
    await expect(momento.createCache(cacheName)).rejects.toThrow(
      CacheAlreadyExistsError
    );
    // FIXME https://github.com/momentohq/cacheadmin-v2/issues/107
    // await momento.deleteCache(cacheName);
  });
});
