import {v4} from 'uuid';
import {
  expectWithMessage,
  ItBehavesLikeItValidatesCacheName,
  testCacheName,
  ValidateCacheProps,
  WithCache,
} from './common-int-test-utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/clients/ICacheClient';
import {
  CreateCache,
  DeleteCache,
  ListCaches,
  MomentoErrorCode,
  CacheFlush,
  CacheGet,
  CacheSet,
} from '@gomomento/sdk-core';

export function runCreateDeleteListCacheTests(Momento: ICacheClient) {
  describe('create/delete cache', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return Momento.createCache(props.cacheName);
    });

    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return Momento.deleteCache(props.cacheName);
    });

    it('should return NotFoundError if deleting a non-existent cache', async () => {
      const cacheName = testCacheName();
      const deleteResponse = await Momento.deleteCache(cacheName);
      expectWithMessage(() => {
        expect(deleteResponse).toBeInstanceOf(DeleteCache.Error);
      }, `expected ERROR but got ${deleteResponse.toString()}`);
      if (deleteResponse instanceof DeleteCache.Error) {
        expect(deleteResponse.errorCode()).toEqual(
          MomentoErrorCode.NOT_FOUND_ERROR
        );
      }
    });

    it('should return AlreadyExists response if trying to create a cache that already exists', async () => {
      const cacheName = testCacheName();
      await WithCache(Momento, cacheName, async () => {
        const createResponse = await Momento.createCache(cacheName);
        expect(createResponse).toBeInstanceOf(CreateCache.AlreadyExists);
      });
    });

    it('should create 1 cache and list the created cache', async () => {
      const cacheName = testCacheName();
      await WithCache(Momento, cacheName, async () => {
        const listResponse = await Momento.listCaches();
        expectWithMessage(() => {
          expect(listResponse).toBeInstanceOf(ListCaches.Success);
        }, `expected SUCCESS but got ${listResponse.toString()}`);
        if (listResponse instanceof ListCaches.Success) {
          const caches = listResponse.getCaches();
          const names = caches.map(c => c.getName());
          expect(names.includes(cacheName)).toBeTruthy();
        }
      });
    });
  });

  describe('flush cache', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return Momento.flushCache(props.cacheName);
    });

    it('should return NotFoundError if flushing a non-existent cache', async () => {
      const cacheName = testCacheName();
      const flushResponse = await Momento.flushCache(cacheName);
      expectWithMessage(() => {
        expect(flushResponse).toBeInstanceOf(CacheFlush.Error);
      }, `expected ERROR but got ${flushResponse.toString()}`);
      if (flushResponse instanceof CacheFlush.Error) {
        expect(flushResponse.errorCode()).toEqual(
          MomentoErrorCode.NOT_FOUND_ERROR
        );
      }
    });

    it('should return success while flushing empty cache', async () => {
      const cacheName = testCacheName();
      await WithCache(Momento, cacheName, async () => {
        const flushResponse = await Momento.flushCache(cacheName);
        expectWithMessage(() => {
          expect(flushResponse).toBeInstanceOf(CacheFlush.Success);
        }, `expected SUCCESS but got ${flushResponse.toString()}`);
      });
    });

    it('should return success while flushing non-empty cache', async () => {
      const cacheName = testCacheName();
      const key1 = v4();
      const key2 = v4();
      const value1 = v4();
      const value2 = v4();
      await WithCache(Momento, cacheName, async () => {
        const setResponse1 = await Momento.set(cacheName, key1, value1);
        expectWithMessage(() => {
          expect(setResponse1).toBeInstanceOf(CacheSet.Success);
        }, `expected SUCCESS but got ${setResponse1.toString()}`);
        const setResponse2 = await Momento.set(cacheName, key2, value2);
        expectWithMessage(() => {
          expect(setResponse2).toBeInstanceOf(CacheSet.Success);
        }, `expected SUCCESS but got ${setResponse2.toString()}`);
        const flushResponse = await Momento.flushCache(cacheName);
        expectWithMessage(() => {
          expect(flushResponse).toBeInstanceOf(CacheFlush.Success);
        }, `expected SUCCESS but got ${flushResponse.toString()}`);
        const getResponse1 = await Momento.get(cacheName, key1);
        const getResponse2 = await Momento.get(cacheName, key2);
        expectWithMessage(() => {
          expect(getResponse1).toBeInstanceOf(CacheGet.Miss);
        }, `expected MISS but got ${getResponse1.toString()}`);
        expectWithMessage(() => {
          expect(getResponse2).toBeInstanceOf(CacheGet.Miss);
        }, `expected MISS but got ${getResponse2.toString()}`);
      });
    });
  });
}
