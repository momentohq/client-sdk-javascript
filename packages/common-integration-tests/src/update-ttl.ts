import {v4} from 'uuid';
import {
  ValidateCacheProps,
  ItBehavesLikeItValidatesCacheName,
  expectWithMessage,
} from './common-int-test-utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/internal/clients/cache';
import {
  CacheUpdateTtl,
  CacheDecreaseTtl,
  CacheIncreaseTtl,
  CacheItemGetTtl,
} from '@gomomento/sdk-core';
export function runUpdateTtlTest(
  Momento: ICacheClient,
  IntegrationTestCacheName: string
) {
  describe('#updateTTL', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return Momento.updateTtl(props.cacheName, v4(), 10000);
    });

    it('should Miss for a key that does not exist in the cache', async () => {
      const response = await Momento.updateTtl(
        IntegrationTestCacheName,
        v4(),
        20000
      );

      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheUpdateTtl.Miss);
      }, `expected MISS but got ${response.toString()}`);
    });

    it('should Set the new TTL for a key that exists in the cache', async () => {
      const cacheKey = v4();
      await Momento.set(IntegrationTestCacheName, cacheKey, cacheKey, {
        ttl: 10,
      });

      const response = await Momento.updateTtl(
        IntegrationTestCacheName,
        cacheKey,
        20000
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheUpdateTtl.Set);
      }, `expected SET but got ${response.toString()}`);

      const ttlResponse = await Momento.itemGetTtl(
        IntegrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(ttlResponse).toBeInstanceOf(CacheItemGetTtl.Hit);
      }, `expected HIT but got ${ttlResponse.toString()}`);
      const ttlResult = ttlResponse as CacheItemGetTtl.Hit;
      console.log('\nTtl result:', ttlResult);
      expect(ttlResult.remainingTtlMillis()).toBeLessThan(20000);
      expect(ttlResult.remainingTtlMillis()).toBeGreaterThan(15000);
    });

    it('should Error if given a TTL below 0', async () => {
      const cacheKey = v4();
      await Momento.set(IntegrationTestCacheName, cacheKey, cacheKey, {
        ttl: 10,
      });

      const response = await Momento.updateTtl(
        IntegrationTestCacheName,
        cacheKey,
        -20000
      );

      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheUpdateTtl.Error);
      }, `expected ERROR but got ${response.toString()}`);
    });
  });

  describe('#increaseTTL', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return Momento.increaseTtl(props.cacheName, v4(), 10000);
    });

    it('should Miss if given key does not exist in the cache', async () => {
      const response = await Momento.increaseTtl(
        IntegrationTestCacheName,
        v4(),
        20000
      );

      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncreaseTtl.Miss);
      }, `expected MISS but got ${response.toString()}`);
    });

    it('should Set the new TTL for a key that exists in the cache and new TTL is greater than current TTL', async () => {
      const cacheKey = v4();
      await Momento.set(IntegrationTestCacheName, cacheKey, cacheKey, {
        ttl: 10,
      });

      const response = await Momento.increaseTtl(
        IntegrationTestCacheName,
        cacheKey,
        20000
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncreaseTtl.Set);
      }, `expected SET but got ${response.toString()}`);

      const ttlResponse = await Momento.itemGetTtl(
        IntegrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(ttlResponse).toBeInstanceOf(CacheItemGetTtl.Hit);
      }, `expected HIT but got ${ttlResponse.toString()}`);
      const ttlResult = ttlResponse as CacheItemGetTtl.Hit;
      console.log('\nTtl result:', ttlResult);
      expect(ttlResult.remainingTtlMillis()).toBeLessThan(20000);
      expect(ttlResult.remainingTtlMillis()).toBeGreaterThan(15000);
    });

    it('should Error if given TTL is less than current TTL', async () => {
      const cacheKey = v4();
      await Momento.set(IntegrationTestCacheName, cacheKey, cacheKey, {
        ttl: 10,
      });

      const response = await Momento.increaseTtl(
        IntegrationTestCacheName,
        cacheKey,
        5000
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncreaseTtl.Error);
      }, `expected ERROR but got ${response.toString()}`);
    });

    it('should Error if given a TTL below 0', async () => {
      const cacheKey = v4();
      await Momento.set(IntegrationTestCacheName, cacheKey, cacheKey, {
        ttl: 10,
      });

      const response = await Momento.increaseTtl(
        IntegrationTestCacheName,
        cacheKey,
        -20000
      );

      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncreaseTtl.Error);
      }, `expected ERROR but got ${response.toString()}`);
    });
  });

  describe('#decreaseTTL', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return Momento.decreaseTtl(props.cacheName, v4(), 10000);
    });

    it('should Miss if given key does not exist in the cache', async () => {
      const response = await Momento.decreaseTtl(
        IntegrationTestCacheName,
        v4(),
        5000
      );

      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheDecreaseTtl.Miss);
      }, `expected MISS but got ${response.toString()}`);
    });

    it('should Set the new TTL for a key that exists in the cache and new TTL is less than current TTL', async () => {
      const cacheKey = v4();
      await Momento.set(IntegrationTestCacheName, cacheKey, cacheKey, {
        ttl: 10,
      });

      const response = await Momento.decreaseTtl(
        IntegrationTestCacheName,
        cacheKey,
        5000
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheDecreaseTtl.Set);
      }, `expected SET but got ${response.toString()}`);

      const ttlResponse = await Momento.itemGetTtl(
        IntegrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(ttlResponse).toBeInstanceOf(CacheItemGetTtl.Hit);
      }, `expected HIT but got ${ttlResponse.toString()}`);
      const ttlResult = ttlResponse as CacheItemGetTtl.Hit;
      console.log('\nTtl result:', ttlResult);
      expect(ttlResult.remainingTtlMillis()).toBeLessThan(5000);
      expect(ttlResult.remainingTtlMillis()).toBeGreaterThan(0);
    });

    it('should Error if given TTL is greater than current TTL', async () => {
      const cacheKey = v4();
      await Momento.set(IntegrationTestCacheName, cacheKey, cacheKey, {
        ttl: 10,
      });

      const response = await Momento.decreaseTtl(
        IntegrationTestCacheName,
        cacheKey,
        20000
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheDecreaseTtl.Error);
      }, `expected ERROR but got ${response.toString()}`);
    });

    it('should Error if given a TTL below 0', async () => {
      const cacheKey = v4();
      await Momento.set(IntegrationTestCacheName, cacheKey, cacheKey, {
        ttl: 10,
      });

      const response = await Momento.decreaseTtl(
        IntegrationTestCacheName,
        cacheKey,
        -20000
      );

      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheDecreaseTtl.Error);
      }, `expected ERROR but got ${response.toString()}`);
    });
  });
}
