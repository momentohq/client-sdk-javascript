import {v4} from 'uuid';
import {
  expectWithMessage,
  ItBehavesLikeItValidatesCacheName,
  itOnlyInCi,
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

export function runCreateDeleteListCacheTests(cacheClient: ICacheClient) {
  describe('create/delete cache', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return cacheClient.createCache(props.cacheName);
    });

    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return cacheClient.deleteCache(props.cacheName);
    });

    it('should return NotFoundError if deleting a non-existent cache', async () => {
      const cacheName = testCacheName();
      const deleteResponse = await cacheClient.deleteCache(cacheName);
      expectWithMessage(() => {
        expect(deleteResponse).toBeInstanceOf(DeleteCache.Error);
      }, `expected ERROR but got ${deleteResponse.toString()}`);
      if (deleteResponse instanceof DeleteCache.Error) {
        expect(deleteResponse.errorCode()).toEqual(
          MomentoErrorCode.CACHE_NOT_FOUND_ERROR
        );
      }
    });

    it('should return AlreadyExists response if trying to create a cache that already exists', async () => {
      const cacheName = testCacheName();
      await WithCache(cacheClient, cacheName, async () => {
        const createResponse = await cacheClient.createCache(cacheName);
        expect(createResponse).toBeInstanceOf(CreateCache.AlreadyExists);
      });
    });

    itOnlyInCi('should create 1 cache and list the created cache', async () => {
      const cacheName = testCacheName();
      await WithCache(cacheClient, cacheName, async () => {
        const listResponse = await cacheClient.listCaches();
        expectWithMessage(() => {
          expect(listResponse).toBeInstanceOf(ListCaches.Success);
        }, `expected SUCCESS but got ${listResponse.toString()}`);
        if (listResponse instanceof ListCaches.Success) {
          const caches = listResponse.getCaches();
          const knownCaches = caches.filter(c => c.getName() === cacheName);
          expect(knownCaches.length === 1).toBeTrue();
          const cache = knownCaches[0];

          const expectedThroughputLimit = 10240;
          const expectedItemSizeLimit = 4883;
          const expectedThrottlingLimit = 500;
          const expectedMaxTtl = 86400;
          const expectedPublishRate = 100;
          const expectedSubscriptionCount = 100;
          const expectedPublishMessageSize = 100;

          const limitsMessage = `test/canary cache limits must be: throughput_throttling_limit=${expectedThroughputLimit}, item_size_limit=${expectedItemSizeLimit}, throttling_limit=${expectedThrottlingLimit}, max_ttl=${expectedMaxTtl}; topic limits must be: publish_rate=${expectedPublishRate}, subscription_count=${expectedSubscriptionCount}, publish_message_size=${expectedPublishMessageSize}.`;

          // checking that cache limits are equal to or greater than default limits
          expectWithMessage(() => {
            expect(
              cache.getCacheLimits().maxThroughputKbps
            ).toBeGreaterThanOrEqual(expectedThroughputLimit);
          }, `invalid throughput_throttling_limit (${cache.getCacheLimits().maxThroughputKbps}). ${limitsMessage}`);
          expectWithMessage(() => {
            expect(cache.getCacheLimits().maxItemSizeKb).toEqual(
              expectedItemSizeLimit
            );
          }, `invalid item_size_limit (${cache.getCacheLimits().maxItemSizeKb}). ${limitsMessage}`);
          expectWithMessage(() => {
            expect(
              cache.getCacheLimits().maxTrafficRate
              // TODO: normally we would do a full equality assertion here, just to ensure that the configurations
              // are uniform across all canary environments, but we are in the process of updating the limits to allow
              // more parallelization of tests. Therefore we are temporarily relaxing this until we find the right value.
            ).toBeGreaterThanOrEqual(expectedThrottlingLimit);
          }, `invalid throttling_limit (${cache.getCacheLimits().maxTrafficRate}). ${limitsMessage}`);
          expectWithMessage(() => {
            expect(cache.getCacheLimits().maxTtlSeconds).toEqual(
              expectedMaxTtl
            );
          }, `invalid max_ttl (${cache.getCacheLimits().maxTtlSeconds}). ${limitsMessage}`);

          // topic limits
          expectWithMessage(() => {
            expect(cache.getTopicLimits().maxPublishMessageSizeKb).toEqual(
              expectedPublishMessageSize
            );
          }, `invalid publish_message_size (${cache.getTopicLimits().maxPublishMessageSizeKb}). ${limitsMessage}`);
          expectWithMessage(() => {
            expect(cache.getTopicLimits().maxPublishRate).toEqual(
              expectedPublishRate
            );
          }, `invalid publish_rate (${cache.getTopicLimits().maxPublishRate}). ${limitsMessage}`);
          expectWithMessage(() => {
            expect(cache.getTopicLimits().maxSubscriptionCount).toEqual(
              expectedSubscriptionCount
            );
          }, `invalid subscription_count (${cache.getTopicLimits().maxSubscriptionCount}). ${limitsMessage}`);
        }
      });
    });
  });

  describe('flush cache', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return cacheClient.flushCache(props.cacheName);
    });

    it('should return NotFoundError if flushing a non-existent cache', async () => {
      const cacheName = testCacheName();
      const flushResponse = await cacheClient.flushCache(cacheName);
      expectWithMessage(() => {
        expect(flushResponse).toBeInstanceOf(CacheFlush.Error);
      }, `expected ERROR but got ${flushResponse.toString()}`);
      if (flushResponse instanceof CacheFlush.Error) {
        expect(flushResponse.errorCode()).toEqual(
          MomentoErrorCode.CACHE_NOT_FOUND_ERROR
        );
      }
    });

    it('should return success while flushing empty cache', async () => {
      const cacheName = testCacheName();
      await WithCache(cacheClient, cacheName, async () => {
        const flushResponse = await cacheClient.flushCache(cacheName);
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
      await WithCache(cacheClient, cacheName, async () => {
        const setResponse1 = await cacheClient.set(cacheName, key1, value1);
        expectWithMessage(() => {
          expect(setResponse1).toBeInstanceOf(CacheSet.Success);
        }, `expected SUCCESS but got ${setResponse1.toString()}`);
        const setResponse2 = await cacheClient.set(cacheName, key2, value2);
        expectWithMessage(() => {
          expect(setResponse2).toBeInstanceOf(CacheSet.Success);
        }, `expected SUCCESS but got ${setResponse2.toString()}`);
        const flushResponse = await cacheClient.flushCache(cacheName);
        expectWithMessage(() => {
          expect(flushResponse).toBeInstanceOf(CacheFlush.Success);
        }, `expected SUCCESS but got ${flushResponse.toString()}`);
        const getResponse1 = await cacheClient.get(cacheName, key1);
        const getResponse2 = await cacheClient.get(cacheName, key2);
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
