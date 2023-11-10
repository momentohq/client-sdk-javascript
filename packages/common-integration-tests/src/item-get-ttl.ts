import {v4} from 'uuid';
import {
  ValidateCacheProps,
  ItBehavesLikeItValidatesCacheName,
  expectWithMessage,
} from './common-int-test-utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/internal/clients/cache';
import {CacheItemGetTtl, CollectionTtl} from '@gomomento/sdk-core';
import {delay} from './auth-client';
import {describe, it, expect} from 'vitest';
export function runItemGetTtlTest(
  momento: ICacheClient,
  integrationTestCacheName: string
) {
  describe('item ttl', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return momento.itemGetTtl(props.cacheName, v4());
    });

    it('should get item ttl remaining for a scalar', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      await momento.set(integrationTestCacheName, cacheKey, cacheValue, {
        ttl: 10,
      });

      // string cache key
      let itemGetTtlResponse = await momento.itemGetTtl(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(itemGetTtlResponse).toBeInstanceOf(CacheItemGetTtl.Hit);
      }, `expected HIT but got ${itemGetTtlResponse.toString()}`);
      let hitResult = itemGetTtlResponse as CacheItemGetTtl.Hit;
      expect(hitResult.remainingTtlMillis()).toBeLessThan(10000);
      expect(hitResult.remainingTtlMillis()).toBeGreaterThan(7000);

      // byte array cache key
      itemGetTtlResponse = await momento.itemGetTtl(
        integrationTestCacheName,
        new TextEncoder().encode(cacheKey)
      );
      expectWithMessage(() => {
        expect(itemGetTtlResponse).toBeInstanceOf(CacheItemGetTtl.Hit);
      }, `expected HIT but got ${itemGetTtlResponse.toString()}`);
      hitResult = itemGetTtlResponse as CacheItemGetTtl.Hit;
      expect(hitResult.remainingTtlMillis()).toBeLessThan(10000);
      expect(hitResult.remainingTtlMillis()).toBeGreaterThan(7000);
    });

    it('should get item ttl remaining for a dictionary', async () => {
      const cacheKey = v4();
      const cacheValue = {foo: v4()};
      await momento.dictionarySetFields(
        integrationTestCacheName,
        cacheKey,
        cacheValue,
        {
          ttl: CollectionTtl.of(10),
        }
      );

      // string cache key
      const itemGetTtlResponse = await momento.itemGetTtl(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(itemGetTtlResponse).toBeInstanceOf(CacheItemGetTtl.Hit);
      }, `expected HIT but got ${itemGetTtlResponse.toString()}`);
      const hitResult = itemGetTtlResponse as CacheItemGetTtl.Hit;
      expect(hitResult.remainingTtlMillis()).toBeLessThan(10000);
      expect(hitResult.remainingTtlMillis()).toBeGreaterThan(7000);
    });

    it('should return a miss for a non-existent key', async () => {
      const cacheKey = v4();
      // string cache key
      const itemGetTtlResponse = await momento.itemGetTtl(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(itemGetTtlResponse).toBeInstanceOf(CacheItemGetTtl.Miss);
      }, `expected MISS but got ${itemGetTtlResponse.toString()}`);
    });

    it('should return a miss for an expired key', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      await momento.set(integrationTestCacheName, cacheKey, cacheValue, {
        ttl: 2,
      });

      // string cache key
      let itemGetTtlResponse = await momento.itemGetTtl(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(itemGetTtlResponse).toBeInstanceOf(CacheItemGetTtl.Hit);
      }, `expected HIT but got ${itemGetTtlResponse.toString()}`);

      await delay(2000);

      // byte array cache key
      itemGetTtlResponse = await momento.itemGetTtl(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(itemGetTtlResponse).toBeInstanceOf(CacheItemGetTtl.Miss);
      }, `expected MISS but got ${itemGetTtlResponse.toString()}`);
    });

    it('should support happy path for itemGetTtl via curried cache via ICache interface', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      await momento.set(integrationTestCacheName, cacheKey, cacheValue, {
        ttl: 10,
      });

      const cache = momento.cache(integrationTestCacheName);

      // string cache key
      const itemGetTtlResponse = await cache.itemGetTtl(cacheKey);
      expectWithMessage(() => {
        expect(itemGetTtlResponse).toBeInstanceOf(CacheItemGetTtl.Hit);
      }, `expected HIT but got ${itemGetTtlResponse.toString()}`);
      const hitResult = itemGetTtlResponse as CacheItemGetTtl.Hit;
      expect(hitResult.remainingTtlMillis()).toBeLessThan(10000);
      expect(hitResult.remainingTtlMillis()).toBeGreaterThan(7000);
    });
  });
}
