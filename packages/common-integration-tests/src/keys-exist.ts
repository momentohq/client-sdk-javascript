import {v4} from 'uuid';
import {
  ValidateCacheProps,
  ItBehavesLikeItValidatesCacheName,
  expectWithMessage,
} from './common-int-test-utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/internal/clients/cache';
import {CacheKeyExists, CacheKeysExist} from '@gomomento/sdk-core';
export function runKeysExistTest(
  Momento: ICacheClient,
  IntegrationTestCacheName: string
) {
  describe('#keyExists', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return Momento.keyExists(props.cacheName, v4());
    });

    it('should return false for given key if cache is empty', async () => {
      const response = await Momento.keyExists(IntegrationTestCacheName, v4());

      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheKeyExists.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      const success = response as CacheKeyExists.Success;
      expect(success.exists()).toEqual(false);
    });

    it('should return false for given key if cache is not empty but does not have the key', async () => {
      const cacheKey = v4();
      const anotherKey = v4();
      await Momento.set(IntegrationTestCacheName, cacheKey, cacheKey);

      const response = await Momento.keyExists(
        IntegrationTestCacheName,
        anotherKey
      );

      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheKeyExists.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      const success = response as CacheKeyExists.Success;
      expect(success.exists()).toEqual(false);
    });

    it('should return true for given key if cache is not empty and has the key', async () => {
      const cacheKey = v4();
      await Momento.set(IntegrationTestCacheName, cacheKey, cacheKey);

      const response = await Momento.keyExists(
        IntegrationTestCacheName,
        cacheKey
      );

      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheKeyExists.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      const success = response as CacheKeyExists.Success;
      expect(success.exists()).toEqual(true);
    });

    it('should support happy path for keyExists via curried cache via ICache interface', async () => {
      const cacheKey = v4();
      const cache = Momento.cache(IntegrationTestCacheName);
      await cache.set(cacheKey, cacheKey);

      const response = await cache.keyExists(cacheKey);

      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheKeyExists.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      const success = response as CacheKeyExists.Success;
      expect(success.exists()).toEqual(true);
    });
  });

  describe('#keysExist', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return Momento.keysExist(props.cacheName, [v4()]);
    });

    it('should return empty list if given empty key list', async () => {
      const response = await Momento.keysExist(IntegrationTestCacheName, []);

      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheKeysExist.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      const success = response as CacheKeyExists.Success;
      expect(success.exists()).toEqual([]);
    });

    it('should return true only for keys that exist in the cache', async () => {
      const key1 = v4();
      const key2 = v4();
      const key3 = v4();
      const key4 = v4();
      await Momento.set(IntegrationTestCacheName, key1, key1);
      await Momento.set(IntegrationTestCacheName, key3, key3);

      const responseOrdering1 = await Momento.keysExist(
        IntegrationTestCacheName,
        [key1, key2, key3]
      );

      expectWithMessage(() => {
        expect(responseOrdering1).toBeInstanceOf(CacheKeysExist.Success);
      }, `expected SUCCESS but got ${responseOrdering1.toString()}`);

      const successOrdering1 = responseOrdering1 as CacheKeyExists.Success;
      expect(successOrdering1.exists()).toEqual([true, false, true]);

      const responseOrdering2 = await Momento.keysExist(
        IntegrationTestCacheName,
        [key2, key3, key1]
      );

      expectWithMessage(() => {
        expect(responseOrdering2).toBeInstanceOf(CacheKeysExist.Success);
      }, `expected SUCCESS but got ${responseOrdering2.toString()}`);

      const successOrdering2 = responseOrdering2 as CacheKeyExists.Success;
      expect(successOrdering2.exists()).toEqual([false, true, true]);

      const responseOrdering3 = await Momento.keysExist(
        IntegrationTestCacheName,
        [key2, key4]
      );

      expectWithMessage(() => {
        expect(responseOrdering3).toBeInstanceOf(CacheKeysExist.Success);
      }, `expected SUCCESS but got ${responseOrdering3.toString()}`);

      const successOrdering3 = responseOrdering3 as CacheKeyExists.Success;
      expect(successOrdering3.exists()).toEqual([false, false]);
    });

    it('should support happy path for keysExist via curried cache via ICache interface', async () => {
      const cacheKey1 = v4();
      const cacheKey2 = v4();
      const cache = Momento.cache(IntegrationTestCacheName);
      await cache.set(cacheKey1, cacheKey1);

      const response = await cache.keysExist([cacheKey1, cacheKey2]);

      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheKeysExist.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      const success = response as CacheKeysExist.Success;
      expect(success.exists()).toEqual([true, false]);
    });
  });
}
