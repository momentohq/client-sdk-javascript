import {v4} from 'uuid';
import {
  ValidateCacheProps,
  ItBehavesLikeItValidatesCacheName,
  expectWithMessage,
  zipToRecord,
} from '../common-int-test-utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/internal/clients/cache';
import {CacheKeyExists, CacheKeysExist} from '@gomomento/sdk-core';

export function runKeysExistTest(
  cacheClient: ICacheClient,
  integrationTestCacheName: string
) {
  describe('#keyExists', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return cacheClient.keyExists(props.cacheName, v4());
    });

    it('should return false for given key if cache is empty', async () => {
      const response = await cacheClient.keyExists(
        integrationTestCacheName,
        v4()
      );

      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheKeyExists.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      const success = response as CacheKeyExists.Success;
      expect(success.exists()).toEqual(false);
    });

    it('should return false for given key if cache is not empty but does not have the key', async () => {
      const cacheKey = v4();
      const anotherKey = v4();
      await cacheClient.set(integrationTestCacheName, cacheKey, cacheKey);

      const response = await cacheClient.keyExists(
        integrationTestCacheName,
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
      await cacheClient.set(integrationTestCacheName, cacheKey, cacheKey);

      const response = await cacheClient.keyExists(
        integrationTestCacheName,
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
      const cache = cacheClient.cache(integrationTestCacheName);
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
      return cacheClient.keysExist(props.cacheName, [v4()]);
    });

    it('should return empty list if given empty key list', async () => {
      const response = await cacheClient.keysExist(
        integrationTestCacheName,
        []
      );

      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheKeysExist.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      const success = response as CacheKeysExist.Success;
      expect(success.exists()).toEqual([]);
    });

    it('should return true only for keys that exist in the cache', async () => {
      const key1 = v4();
      const key2 = v4();
      const key3 = v4();
      const key4 = v4();
      await cacheClient.set(integrationTestCacheName, key1, key1);
      await cacheClient.set(integrationTestCacheName, key3, key3);

      let keysList = [key1, key2, key3];
      let existsMask = [true, false, true];
      const responseOrdering1 = await cacheClient.keysExist(
        integrationTestCacheName,
        [key1, key2, key3]
      );

      expectWithMessage(() => {
        expect(responseOrdering1).toBeInstanceOf(CacheKeysExist.Success);
      }, `expected SUCCESS but got ${responseOrdering1.toString()}`);

      const successOrdering1 = responseOrdering1 as CacheKeysExist.Success;
      expect(successOrdering1.exists()).toEqual(existsMask);

      expect(successOrdering1.valueRecord()).toEqual(
        zipToRecord(keysList, existsMask)
      );

      keysList = [key2, key3, key1];
      existsMask = [false, true, true];
      const responseOrdering2 = await cacheClient.keysExist(
        integrationTestCacheName,
        keysList
      );

      expectWithMessage(() => {
        expect(responseOrdering2).toBeInstanceOf(CacheKeysExist.Success);
      }, `expected SUCCESS but got ${responseOrdering2.toString()}`);

      const successOrdering2 = responseOrdering2 as CacheKeysExist.Success;
      expect(successOrdering2.exists()).toEqual(existsMask);
      expect(successOrdering2.valueRecord()).toEqual(
        zipToRecord(keysList, existsMask)
      );

      keysList = [key2, key4];
      existsMask = [false, false];
      const responseOrdering3 = await cacheClient.keysExist(
        integrationTestCacheName,
        keysList
      );

      expectWithMessage(() => {
        expect(responseOrdering3).toBeInstanceOf(CacheKeysExist.Success);
      }, `expected SUCCESS but got ${responseOrdering3.toString()}`);

      const successOrdering3 = responseOrdering3 as CacheKeysExist.Success;
      expect(successOrdering3.exists()).toEqual(existsMask);
      expect(successOrdering3.valueRecord()).toEqual(
        zipToRecord(keysList, existsMask)
      );
    });

    it('should support happy path for keysExist via curried cache via ICache interface', async () => {
      const cacheKey1 = v4();
      const cacheKey2 = v4();
      const cache = cacheClient.cache(integrationTestCacheName);
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
