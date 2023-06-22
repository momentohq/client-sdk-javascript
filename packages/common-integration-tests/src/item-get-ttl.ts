import {v4} from 'uuid';
import {
  ValidateCacheProps,
  ItBehavesLikeItValidatesCacheName,
  expectWithMessage,
} from './common-int-test-utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/internal/clients/cache';
import {CacheItemGetTtl} from '@gomomento/sdk-core';
export function runItemGetTtlTest(
  Momento: ICacheClient,
  IntegrationTestCacheName: string
) {
  describe('item ttl', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return Momento.itemGetTtl(props.cacheName, v4());
    });

    it('should get item ttl remaining', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      await Momento.set(IntegrationTestCacheName, cacheKey, cacheValue, {
        ttl: 10,
      });

      // string cache key
      let itemGetTtlResponse = await Momento.itemGetTtl(
        IntegrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(itemGetTtlResponse).toBeInstanceOf(CacheItemGetTtl.Hit);
      }, `expected HIT but got ${itemGetTtlResponse.toString()}`);
      let hitResult = itemGetTtlResponse as CacheItemGetTtl.Hit;
      expect(hitResult.remainingTtlMillis()).toBeLessThan(10000);
      expect(hitResult.remainingTtlMillis()).toBeGreaterThan(9000);

      // byte array cache key
      itemGetTtlResponse = await Momento.itemGetTtl(
        IntegrationTestCacheName,
        new TextEncoder().encode(cacheKey)
      );
      expectWithMessage(() => {
        expect(itemGetTtlResponse).toBeInstanceOf(CacheItemGetTtl.Hit);
      }, `expected HIT but got ${itemGetTtlResponse.toString()}`);
      hitResult = itemGetTtlResponse as CacheItemGetTtl.Hit;
      expect(hitResult.remainingTtlMillis()).toBeLessThan(10000);
      expect(hitResult.remainingTtlMillis()).toBeGreaterThan(9000);
    });
  });
}
