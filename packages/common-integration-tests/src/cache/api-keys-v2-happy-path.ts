import {
  CacheGet,
  CacheSet,
  CacheGetBatch,
  ICacheClient,
  CacheSetBatch,
  ListCaches,
  CacheFlush,
  CacheDictionaryFetch,
  CacheDictionaryGetFields,
  CacheDictionaryIncrement,
  CacheDictionaryGetField,
  CacheDictionaryRemoveFields,
  CacheDictionarySetFields,
  CacheDictionaryLength,
  CacheDelete,
  CacheSetWithHash,
  CacheGetWithHash,
  CacheIncrement,
  CacheSetIfAbsent,
  CacheSetIfPresent,
  CacheSetIfEqual,
  CacheSetIfNotEqual,
  CacheSetIfPresentAndNotEqual,
  CacheSetIfPresentAndHashEqual,
  CacheSetIfAbsentOrEqual,
  CacheSetIfPresentAndHashNotEqual,
  CacheSetIfAbsentOrHashEqual,
  CacheSetIfAbsentOrHashNotEqual,
  CacheItemGetTtl,
  CacheItemGetType,
  ItemType,
  CacheKeysExist,
  CacheUpdateTtl,
  CacheListFetch,
  CacheListLength,
  CacheListPopBack,
  CacheListPopFront,
  CacheListPushBack,
  CacheListPushFront,
  CacheListRemoveValue,
  CacheListConcatenateBack,
  CacheListRetain,
  CacheListConcatenateFront,
  CacheSetAddElements,
  CacheSetFetch,
  CacheSetContainsElements,
  CacheSetRemoveElements,
  CacheSetSample,
  CacheSetPop,
  CacheSetLength,
  CacheSortedSetPutElements,
  CacheSortedSetFetch,
  CacheSortedSetLength,
  CacheSortedSetLengthByScore,
  SortedSetSource,
  CacheSortedSetUnionStore,
  CacheSortedSetGetScores,
  CacheSortedSetRemoveElements,
  CacheSortedSetIncrementScore,
  CacheSortedSetGetRank,
  SortedSetOrder,
  CollectionTtl,
} from '@gomomento/sdk-core';
import {
  expectWithMessage,
  itOnlyInCi,
  testCacheName,
  uint8ArrayForTest,
  WithCache,
  zipToRecord,
} from '../common-int-test-utils';
import {v4} from 'uuid';

export function runCacheTestWithApiKeyV2(
  cacheClient: ICacheClient,
  integrationTestCacheName: string
) {
  describe('cache client tests with api key v2', () => {
    // control plane

    describe('ci only - create and list cache with expected limits', () => {
      itOnlyInCi(
        'should create 1 cache and list the created cache with expected limits',
        async () => {
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
        }
      );
    });

    it('successfully flushes non-empty cache', async () => {
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

    // get set delete

    it('setBatch and getBatch with some hits and misses', async () => {
      // Set some values and check set batch response
      const items = new Map<string, string>([
        ['a', 'alligator'],
        ['b', 'bear'],
        ['c', 'cougar'],
        ['e', 'elephant'],
        ['f', 'flamingo'],
        ['g', 'gorilla'],
      ]);
      const setResponse = await cacheClient.setBatch(
        integrationTestCacheName,
        items
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetBatch.Success);
      }, `expected SUCCESS, received ${setResponse.toString()}`);

      // Check each response in the set batch
      const setResults = (setResponse as CacheSetBatch.Success).results();
      const setKeys = [...items.keys()];
      expectWithMessage(() => {
        expect(setResults.length).toEqual(setKeys.length);
      }, `expected non-empty results, received ${setResults.toString()}`);

      for (const [index, resp] of setResults.entries()) {
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheSet.Success);
        }, `expected SUCCESS for key ${setKeys[index]} but received ${resp.toString()}`);
      }

      // Fetch values and check get batch response
      const keys = ['a', 'b', 'c', '10', '11', '12'];
      const getResponse = await cacheClient.getBatch(
        integrationTestCacheName,
        keys
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGetBatch.Success);
      }, `expected SUCCESS for keys ${keys.toString()}, received ${getResponse.toString()}`);

      // Check each response in the get batch
      const getResults = (getResponse as CacheGetBatch.Success).results();
      expectWithMessage(() => {
        expect(getResults.length).toEqual(keys.length);
      }, `expected non-empty results, received ${getResults.toString()}`);

      for (const [index, resp] of getResults.entries()) {
        const key = keys[index];

        if (['a', 'b', 'c'].includes(key)) {
          expectWithMessage(() => {
            expect(resp).toBeInstanceOf(CacheGet.Hit);
          }, `expected HIT for key ${key} but received ${resp.toString()}`);

          const expectedValue = items.get(key) ?? 'value not in items map';
          const receivedValue =
            resp.value() ?? 'value could not be retrieved from response';
          expectWithMessage(() => {
            expect(receivedValue).toEqual(expectedValue);
          }, `expected key ${key} to be set to ${expectedValue} but received ${receivedValue}`);
        } else {
          expectWithMessage(() => {
            expect(resp).toBeInstanceOf(CacheGet.Miss);
          }, `expected MISS for key ${key} but received ${resp.toString()}`);
        }
      }
    });

    it('should set and get bytes from cache', async () => {
      const cacheKey = new TextEncoder().encode(v4());
      const cacheValue = new TextEncoder().encode(v4());
      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
    });

    it('should setWithHash and getWithHash bytes from cache', async () => {
      const cacheKey = new TextEncoder().encode(v4());
      const cacheValue = v4();
      const setResponse = await cacheClient.setWithHash(
        integrationTestCacheName,
        cacheKey,
        new TextEncoder().encode(cacheValue)
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetWithHash.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const getResponse = await cacheClient.getWithHash(
        integrationTestCacheName,
        cacheKey
      );

      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGetWithHash.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (
        getResponse instanceof CacheGetWithHash.Hit &&
        setResponse instanceof CacheSetWithHash.Stored
      ) {
        expect(getResponse.valueString()).toBe(cacheValue);
        expect(getResponse.hashString()).toEqual(setResponse.hashString());
      }
    });

    it('should set and then delete a value in cache', async () => {
      const cacheKey = v4();
      const cacheValue = new TextEncoder().encode(v4());
      await cacheClient.set(integrationTestCacheName, cacheKey, cacheValue);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);

      const deleteResponse = await cacheClient.delete(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(deleteResponse).toBeInstanceOf(CacheDelete.Success);
      }, `expected SUCCESS but got ${deleteResponse.toString()}`);
      const getMiss = await cacheClient.get(integrationTestCacheName, cacheKey);
      expect(getMiss).toBeInstanceOf(CacheGet.Miss);
    });

    // compare and set methods

    it('setIfAbsent should set and get string from cache', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const setResponse = await cacheClient.setIfAbsent(
        integrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfAbsent.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });

    it('setIfPresent should set string key if key is present', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const initialCacheValue = v4();

      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        initialCacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const setIfPresentResponse = await cacheClient.setIfPresent(
        integrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setIfPresentResponse).toBeInstanceOf(CacheSetIfPresent.Stored);
      }, `expected STORED but got ${setIfPresentResponse.toString()}`);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });

    it('setIfEqual should set cache key if value to check is equal', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const initialCacheValue = v4();

      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        initialCacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const setIfEqualResponse = await cacheClient.setIfEqual(
        integrationTestCacheName,
        cacheKey,
        cacheValue,
        initialCacheValue
      );
      expectWithMessage(() => {
        expect(setIfEqualResponse).toBeInstanceOf(CacheSetIfEqual.Stored);
      }, `expected STORED but got ${setIfEqualResponse.toString()}`);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });

    it('setIfNotEqual should not set cache key if value to check is equal', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const initialCacheValue = v4();

      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        initialCacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const setIfNotEqualResponse = await cacheClient.setIfNotEqual(
        integrationTestCacheName,
        cacheKey,
        cacheValue,
        initialCacheValue
      );
      expectWithMessage(() => {
        expect(setIfNotEqualResponse).toBeInstanceOf(
          CacheSetIfNotEqual.NotStored
        );
      }, `expected NOTSTORED but got ${setIfNotEqualResponse.toString()}`);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(initialCacheValue);
      }
    });

    it('setIfPresentAndNotEqual should set cache key if key is present and value to check is not equal', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const initialCacheValue = v4();

      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        initialCacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const setIfPresentAndNotEqualResponse =
        await cacheClient.setIfPresentAndNotEqual(
          integrationTestCacheName,
          cacheKey,
          cacheValue,
          v4()
        );
      expectWithMessage(() => {
        expect(setIfPresentAndNotEqualResponse).toBeInstanceOf(
          CacheSetIfPresentAndNotEqual.Stored
        );
      }, `expected STORED but got ${setIfPresentAndNotEqualResponse.toString()}`);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });

    it('setIfAbsentOrEqual should not set cache key if key is present and value to check is not equal to cached value', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const initialCacheValue = v4();

      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        initialCacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const setIfAbsentOrEqualResponse = await cacheClient.setIfAbsentOrEqual(
        integrationTestCacheName,
        cacheKey,
        cacheValue,
        v4()
      );
      expectWithMessage(() => {
        expect(setIfAbsentOrEqualResponse).toBeInstanceOf(
          CacheSetIfAbsentOrEqual.NotStored
        );
      }, `expected NOTSTORED but got ${setIfAbsentOrEqualResponse.toString()}`);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(initialCacheValue);
      }
    });

    it('setIfPresentAndHashEqual should not set cache key if key is present and hash of value to check is not equal', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const initialCacheValue = v4();
      const randResponse = await cacheClient.setWithHash(
        integrationTestCacheName,
        cacheKey,
        v4()
      );
      const hash_value =
        randResponse instanceof CacheSetWithHash.Stored
          ? randResponse.hashUint8Array()
          : new TextEncoder().encode(v4());
      const setResponse = await cacheClient.setWithHash(
        integrationTestCacheName,
        cacheKey,
        initialCacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetWithHash.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const setIfPresentAndHashEqualResponse =
        await cacheClient.setIfPresentAndHashEqual(
          integrationTestCacheName,
          cacheKey,
          cacheValue,
          hash_value
        );
      expectWithMessage(() => {
        expect(setIfPresentAndHashEqualResponse).toBeInstanceOf(
          CacheSetIfPresentAndHashEqual.NotStored
        );
      }, `expected NOTSTORED but got ${setIfPresentAndHashEqualResponse.toString()}`);
      const getResponse = await cacheClient.getWithHash(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGetWithHash.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGetWithHash.Hit) {
        expect(getResponse.valueString()).toEqual(initialCacheValue);
      }
    });

    it('setIfPresentAndHashNotEqual should set cache key if key is present and hash of value to check is not equal', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const initialCacheValue = v4();
      const randResponse = await cacheClient.setWithHash(
        integrationTestCacheName,
        cacheKey,
        v4()
      );
      const hash_value =
        randResponse instanceof CacheSetWithHash.Stored
          ? randResponse.hashUint8Array()
          : new TextEncoder().encode(v4());
      const setResponse = await cacheClient.setWithHash(
        integrationTestCacheName,
        cacheKey,
        initialCacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetWithHash.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const setIfPresentAndHashNotEqualResponse =
        await cacheClient.setIfPresentAndHashNotEqual(
          integrationTestCacheName,
          cacheKey,
          cacheValue,
          hash_value
        );
      expectWithMessage(() => {
        expect(setIfPresentAndHashNotEqualResponse).toBeInstanceOf(
          CacheSetIfPresentAndHashNotEqual.Stored
        );
      }, `expected STORED but got ${setIfPresentAndHashNotEqualResponse.toString()}`);
      const getResponse = await cacheClient.getWithHash(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGetWithHash.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (
        getResponse instanceof CacheGetWithHash.Hit &&
        setIfPresentAndHashNotEqualResponse instanceof
          CacheSetIfPresentAndHashNotEqual.Stored
      ) {
        expect(getResponse.valueString()).toEqual(cacheValue);
        expect(getResponse.hashString()).toEqual(
          setIfPresentAndHashNotEqualResponse.hashString()
        );
      }
    });

    it('setIfAbsentOrHashEqual should not set cache key if key is present and hash of value to check is not equal', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const initialCacheValue = v4();
      const randResponse = await cacheClient.setWithHash(
        integrationTestCacheName,
        cacheKey,
        v4()
      );
      const hash_value =
        randResponse instanceof CacheSetWithHash.Stored
          ? randResponse.hashUint8Array()
          : new TextEncoder().encode(v4());
      const setResponse = await cacheClient.setWithHash(
        integrationTestCacheName,
        cacheKey,
        initialCacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetWithHash.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const setIfAbsentOrHashEqualResponse =
        await cacheClient.setIfAbsentOrHashEqual(
          integrationTestCacheName,
          cacheKey,
          cacheValue,
          hash_value
        );
      expectWithMessage(() => {
        expect(setIfAbsentOrHashEqualResponse).toBeInstanceOf(
          CacheSetIfAbsentOrHashEqual.NotStored
        );
      }, `expected NOTSTORED but got ${setIfAbsentOrHashEqualResponse.toString()}`);
      const getResponse = await cacheClient.getWithHash(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGetWithHash.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGetWithHash.Hit) {
        expect(getResponse.valueString()).toEqual(initialCacheValue);
      }
    });

    it('setIfAbsentOrHashNotEqual should set cache key if key is present and hash of value to check is not equal', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const initialCacheValue = v4();
      const randResponse = await cacheClient.setWithHash(
        integrationTestCacheName,
        cacheKey,
        v4()
      );
      const hash_value =
        randResponse instanceof CacheSetWithHash.Stored
          ? randResponse.hashUint8Array()
          : new TextEncoder().encode(v4());
      const setResponse = await cacheClient.setWithHash(
        integrationTestCacheName,
        cacheKey,
        initialCacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetWithHash.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const setIfAbsentOrHashNotEqualResponse =
        await cacheClient.setIfAbsentOrHashNotEqual(
          integrationTestCacheName,
          cacheKey,
          cacheValue,
          hash_value
        );
      expectWithMessage(() => {
        expect(setIfAbsentOrHashNotEqualResponse).toBeInstanceOf(
          CacheSetIfAbsentOrHashNotEqual.Stored
        );
      }, `expected STORED but got ${setIfAbsentOrHashNotEqualResponse.toString()}`);
      const getResponse = await cacheClient.getWithHash(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGetWithHash.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (
        getResponse instanceof CacheGetWithHash.Hit &&
        setIfAbsentOrHashNotEqualResponse instanceof
          CacheSetIfAbsentOrHashNotEqual.Stored
      ) {
        expect(getResponse.valueString()).toEqual(cacheValue);
        expect(getResponse.hashString()).toEqual(
          setIfAbsentOrHashNotEqualResponse.hashString()
        );
      }
    });

    // other cache methods

    it('increment from 0 to expected amount with string field', async () => {
      const field = v4();
      let incrementResponse = await cacheClient.increment(
        integrationTestCacheName,
        field,
        1
      );
      expectWithMessage(() => {
        expect(incrementResponse).toBeInstanceOf(CacheIncrement.Success);
      }, `expected SUCCESS but got ${incrementResponse.toString()}`);
      let successResponse = incrementResponse as CacheIncrement.Success;
      expect(successResponse.valueNumber()).toEqual(1);

      incrementResponse = await cacheClient.increment(
        integrationTestCacheName,
        field,
        41
      );
      expectWithMessage(() => {
        expect(incrementResponse).toBeInstanceOf(CacheIncrement.Success);
      }, `expected SUCCESS but got ${incrementResponse.toString()}`);
      successResponse = incrementResponse as CacheIncrement.Success;
      expect(successResponse.valueNumber()).toEqual(42);
      expect(successResponse.toString()).toEqual('Success: value: 42');

      incrementResponse = await cacheClient.increment(
        integrationTestCacheName,
        field,
        -1042
      );
      expectWithMessage(() => {
        expect(incrementResponse).toBeInstanceOf(CacheIncrement.Success);
      }, `expected SUCCESS but got ${incrementResponse.toString()}`);
      successResponse = incrementResponse as CacheIncrement.Success;
      expect(successResponse.valueNumber()).toEqual(-1000);

      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        field
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      const hitResponse = getResponse as CacheGet.Hit;
      expect(hitResponse.valueString()).toEqual('-1000');
    });

    it('itemGetTtl gets remaining ttl for a scalar item', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      await cacheClient.set(integrationTestCacheName, cacheKey, cacheValue, {
        ttl: 10,
      });

      // string cache key
      let itemGetTtlResponse = await cacheClient.itemGetTtl(
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
      itemGetTtlResponse = await cacheClient.itemGetTtl(
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

    it('itemGetType gets item type for a scalar item', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      await cacheClient.set(integrationTestCacheName, cacheKey, cacheValue);

      // string cache key
      let itemGetTypeResponse = await cacheClient.itemGetType(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(itemGetTypeResponse).toBeInstanceOf(CacheItemGetType.Hit);
      }, `expected HIT but got ${itemGetTypeResponse.toString()}`);
      let hitResult = itemGetTypeResponse as CacheItemGetType.Hit;
      expect(hitResult.itemType()).toEqual(ItemType.SCALAR);

      // byte array cache key
      itemGetTypeResponse = await cacheClient.itemGetType(
        integrationTestCacheName,
        new TextEncoder().encode(cacheKey)
      );
      expectWithMessage(() => {
        expect(itemGetTypeResponse).toBeInstanceOf(CacheItemGetType.Hit);
      }, `expected HIT but got ${itemGetTypeResponse.toString()}`);
      hitResult = itemGetTypeResponse as CacheItemGetType.Hit;
      expect(hitResult.itemType()).toEqual(ItemType.SCALAR);
    });

    it('keysExist returns true only for keys that exist in the cache', async () => {
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

    it('updateTtl sets new TTL for a key that exists in the cache', async () => {
      const cacheKey = v4();
      await cacheClient.set(integrationTestCacheName, cacheKey, cacheKey, {
        ttl: 10,
      });

      const response = await cacheClient.updateTtl(
        integrationTestCacheName,
        cacheKey,
        20000
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheUpdateTtl.Set);
      }, `expected SET but got ${response.toString()}`);

      const ttlResponse = await cacheClient.itemGetTtl(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(ttlResponse).toBeInstanceOf(CacheItemGetTtl.Hit);
      }, `expected HIT but got ${ttlResponse.toString()}`);
      const ttlResult = ttlResponse as CacheItemGetTtl.Hit;
      expect(ttlResult.remainingTtlMillis()).toBeLessThan(20000);
      expect(ttlResult.remainingTtlMillis()).toBeGreaterThan(15000);
    });

    // dictionary

    describe('dictionary', () => {
      it('dictionaryFetch returns expected toString value', async () => {
        const dictionaryName = v4();
        await cacheClient.dictionarySetField(
          integrationTestCacheName,
          dictionaryName,
          'a',
          'b'
        );
        const response = await cacheClient.dictionaryFetch(
          integrationTestCacheName,
          dictionaryName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        expect((response as CacheDictionaryFetch.Hit).toString()).toEqual(
          'Hit: valueDictionaryStringString: a: b'
        );
      });

      it('dictionaryGetFields returns expected toString value', async () => {
        const dictionaryName = v4();
        await cacheClient.dictionarySetField(
          integrationTestCacheName,
          dictionaryName,
          'a',
          'b'
        );
        await cacheClient.dictionarySetField(
          integrationTestCacheName,
          dictionaryName,
          'c',
          'd'
        );
        const getResponse = await cacheClient.dictionaryGetFields(
          integrationTestCacheName,
          dictionaryName,
          ['a', 'c']
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetFields.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
        expect(
          (getResponse as CacheDictionaryGetFields.Hit).toString()
        ).toEqual('Hit: valueDictionaryStringString: a: b, c: d');
      });

      it('dictionaryIncrements from 0 to expected amount with string field', async () => {
        const dictionaryName = v4();
        const field = v4();
        let incrementResponse = await cacheClient.dictionaryIncrement(
          integrationTestCacheName,
          dictionaryName,
          field,
          1
        );
        expectWithMessage(() => {
          expect(incrementResponse).toBeInstanceOf(
            CacheDictionaryIncrement.Success
          );
        }, `expected SUCCESS but got ${incrementResponse.toString()}`);
        let successResponse =
          incrementResponse as CacheDictionaryIncrement.Success;
        expect(successResponse.valueNumber()).toEqual(1);

        incrementResponse = await cacheClient.dictionaryIncrement(
          integrationTestCacheName,
          dictionaryName,
          field,
          41
        );
        expectWithMessage(() => {
          expect(incrementResponse).toBeInstanceOf(
            CacheDictionaryIncrement.Success
          );
        }, `expected SUCCESS but got ${incrementResponse.toString()}`);
        successResponse = incrementResponse as CacheDictionaryIncrement.Success;
        expect(successResponse.valueNumber()).toEqual(42);
        expect(successResponse.toString()).toEqual('Success: value: 42');

        incrementResponse = await cacheClient.dictionaryIncrement(
          integrationTestCacheName,
          dictionaryName,
          field,
          -1042
        );
        expectWithMessage(() => {
          expect(incrementResponse).toBeInstanceOf(
            CacheDictionaryIncrement.Success
          );
        }, `expected SUCCESS but got ${incrementResponse.toString()}`);
        successResponse = incrementResponse as CacheDictionaryIncrement.Success;
        expect(successResponse.valueNumber()).toEqual(-1000);

        const getFieldResponse = await cacheClient.dictionaryGetField(
          integrationTestCacheName,
          dictionaryName,
          field
        );
        expectWithMessage(() => {
          expect(getFieldResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${incrementResponse.toString()}`);
        const hitResponse = getFieldResponse as CacheDictionaryGetField.Hit;
        expect(hitResponse.valueString()).toEqual('-1000');
      });

      it('dictionaryRemoveFields should remove string fields', async () => {
        const dictionaryName = v4();
        const fields = [v4(), v4()];
        const setFields = new Map([
          [fields[0], v4()],
          [fields[1], v4()],
        ]);

        // When the fields do not exist.
        let getFieldsResponse = await cacheClient.dictionaryGetFields(
          integrationTestCacheName,
          dictionaryName,
          fields
        );
        expectWithMessage(() => {
          expect(getFieldsResponse).toBeInstanceOf(
            CacheDictionaryGetFields.Miss
          );
        }, `expected MISS but got ${getFieldsResponse.toString()}`);
        let removeFieldsResponse = await cacheClient.dictionaryRemoveFields(
          integrationTestCacheName,
          dictionaryName,
          fields
        );
        expectWithMessage(() => {
          expect(removeFieldsResponse).toBeInstanceOf(
            CacheDictionaryRemoveFields.Success
          );
        }, `expected SUCCESS but got ${removeFieldsResponse.toString()}`);
        getFieldsResponse = await cacheClient.dictionaryGetFields(
          integrationTestCacheName,
          dictionaryName,
          fields
        );
        expectWithMessage(() => {
          expect(getFieldsResponse).toBeInstanceOf(
            CacheDictionaryGetFields.Miss
          );
        }, `expected MISS but got ${getFieldsResponse.toString()}`);

        // When the fields exist.
        const setFieldsResponse = await cacheClient.dictionarySetFields(
          integrationTestCacheName,
          dictionaryName,
          setFields
        );
        expectWithMessage(() => {
          expect(setFieldsResponse).toBeInstanceOf(
            CacheDictionarySetFields.Success
          );
        }, `expected SUCCESS but got ${setFieldsResponse.toString()}`);
        getFieldsResponse = await cacheClient.dictionaryGetFields(
          integrationTestCacheName,
          dictionaryName,
          fields
        );
        expectWithMessage(() => {
          expect(getFieldsResponse).toBeInstanceOf(
            CacheDictionaryGetFields.Hit
          );
        }, `expected HIT but got ${getFieldsResponse.toString()}`);
        removeFieldsResponse = await cacheClient.dictionaryRemoveFields(
          integrationTestCacheName,
          dictionaryName,
          fields
        );
        expectWithMessage(() => {
          expect(removeFieldsResponse).toBeInstanceOf(
            CacheDictionaryRemoveFields.Success
          );
        }, `expected SUCCESS but got ${removeFieldsResponse.toString()}`);
        getFieldsResponse = await cacheClient.dictionaryGetFields(
          integrationTestCacheName,
          dictionaryName,
          fields
        );
        expectWithMessage(() => {
          expect(getFieldsResponse).toBeInstanceOf(
            CacheDictionaryGetFields.Miss
          );
        }, `expected MISS but got ${getFieldsResponse.toString()}`);
      });

      it('dictionarySetFields should set fields with Uint8Array items', async () => {
        const dictionaryName = v4();
        const field1 = uint8ArrayForTest(v4());
        const value1 = uint8ArrayForTest(v4());
        const field2 = uint8ArrayForTest(v4());
        const value2 = uint8ArrayForTest(v4());
        const response = await cacheClient.dictionarySetFields(
          integrationTestCacheName,
          dictionaryName,
          new Map([
            [field1, value1],
            [field2, value2],
          ]),
          {ttl: CollectionTtl.of(10)}
        );
        expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
        let getResponse = await cacheClient.dictionaryGetField(
          integrationTestCacheName,
          dictionaryName,
          field1
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
        if (getResponse instanceof CacheDictionaryGetField.Hit) {
          expect(getResponse.valueUint8Array()).toEqual(value1);
        }
        getResponse = await cacheClient.dictionaryGetField(
          integrationTestCacheName,
          dictionaryName,
          field2
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);
        if (getResponse instanceof CacheDictionaryGetField.Hit) {
          expect(getResponse.valueUint8Array()).toEqual(value2);
        }
      });

      it('dictionaryLength returns the length if the dictionary exists', async () => {
        const dictionaryName = v4();
        const field1 = v4();
        const value1 = uint8ArrayForTest(v4());
        const field2 = v4();
        const value2 = uint8ArrayForTest(v4());
        await cacheClient.dictionarySetFields(
          integrationTestCacheName,
          dictionaryName,
          new Map([
            [field1, value1],
            [field2, value2],
          ]),
          {ttl: CollectionTtl.of(10)}
        );

        const resp = await cacheClient.dictionaryLength(
          integrationTestCacheName,
          dictionaryName
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheDictionaryLength.Hit);
        }, `expected a HIT but got ${resp.toString()}`);
        expect((resp as CacheDictionaryLength.Hit).length()).toEqual(2);
      });
    });

    // list

    describe('list', () => {
      it('listFetch returns a hit if the list exists', async () => {
        const listName = v4();
        const valueString = 'abc123';
        const valueBytes = new Uint8Array([97, 98, 99, 49, 50, 51]);

        await cacheClient.listPushFront(
          integrationTestCacheName,
          listName,
          valueString
        );

        const respFetch = await cacheClient.listFetch(
          integrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual([
          valueString,
        ]);
        expect((respFetch as CacheListFetch.Hit).valueList()).toEqual([
          valueString,
        ]);
        expect((respFetch as CacheListFetch.Hit).valueListUint8Array()).toEqual(
          [valueBytes]
        );
      });

      it('listLength returns the length if the list exists', async () => {
        const listName = v4();
        const values = ['one', 'two', 'three'];

        await cacheClient.listConcatenateFront(
          integrationTestCacheName,
          listName,
          values
        );

        const resp = await cacheClient.listLength(
          integrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheListLength.Hit);
        }, `expected a HIT but got ${resp.toString()}`);
        expect((resp as CacheListLength.Hit).length()).toEqual(values.length);
      });

      it('listPopBack hits when the list exists', async () => {
        const listName = v4();
        const values = ['one', 'two', 'lol'];
        const poppedValue = values[values.length - 1];
        const poppedBinary = Uint8Array.of(108, 111, 108);

        await cacheClient.listConcatenateFront(
          integrationTestCacheName,
          listName,
          values
        );

        const resp = await cacheClient.listPopBack(
          integrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheListPopBack.Hit);
        }, `expected a HIT but got ${resp.toString()}`);
        expect((resp as CacheListPopBack.Hit).valueString()).toEqual(
          poppedValue
        );
        expect((resp as CacheListPopBack.Hit).valueUint8Array()).toEqual(
          poppedBinary
        );
      });

      it('listPopFront hits when the list exists', async () => {
        const listName = v4();
        const values = ['lol', 'two', 'three'];
        const poppedValue = values[0];
        const poppedBinary = Uint8Array.of(108, 111, 108);

        await cacheClient.listConcatenateFront(
          integrationTestCacheName,
          listName,
          values
        );

        const resp = await cacheClient.listPopFront(
          integrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheListPopFront.Hit);
        }, `expected a HIT but got ${resp.toString()}`);
        expect((resp as CacheListPopFront.Hit).valueString()).toEqual(
          poppedValue
        );
        expect((resp as CacheListPopFront.Hit).valueUint8Array()).toEqual(
          poppedBinary
        );
      });

      it('listPushBack adds to a list', async () => {
        const listName = v4();
        const resp = await cacheClient.listPushBack(
          integrationTestCacheName,
          listName,
          'test'
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheListPushBack.Success);
        }, `expected a SUCCESS but got ${resp.toString()}`);

        const lengthResp = await cacheClient.listLength(
          integrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(lengthResp).toBeInstanceOf(CacheListLength.Hit);
        }, `expected a HIT but got ${lengthResp.toString()}`);
        expect((lengthResp as CacheListLength.Hit).length()).toEqual(1);
      });

      it('listPushFront adds to a list', async () => {
        const listName = v4();
        const resp = await cacheClient.listPushFront(
          integrationTestCacheName,
          listName,
          'test'
        );
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheListPushFront.Success);
        }, `expected a SUCCESS but got ${resp.toString()}`);

        const lengthResp = await cacheClient.listLength(
          integrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(lengthResp).toBeInstanceOf(CacheListLength.Hit);
        }, `expected a HIT but got ${lengthResp.toString()}`);
        expect((lengthResp as CacheListLength.Hit).length()).toEqual(1);
      });

      it('listRemoveValue removes values', async () => {
        const listName = v4();
        const values = [
          'number 9',
          'turn me on',
          'number 9',
          'dead man',
          'number 9',
        ];
        const expectedValues = ['turn me on', 'dead man'];
        const removeValue = 'number 9';

        await cacheClient.listConcatenateFront(
          integrationTestCacheName,
          listName,
          values
        );

        const respRemove = await cacheClient.listRemoveValue(
          integrationTestCacheName,
          listName,
          removeValue
        );
        expect(respRemove).toBeInstanceOf(CacheListRemoveValue.Success);

        const respFetch = await cacheClient.listFetch(
          integrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          expectedValues
        );
      });

      it('listConcatenateBack adds multiple values', async () => {
        const listName = v4();
        const values1 = ['1', '2', '3', '4'];
        const values2 = ['this', 'that'];

        let respConcat = await cacheClient.listConcatenateBack(
          integrationTestCacheName,
          listName,
          values1
        );
        expectWithMessage(() => {
          expect(respConcat).toBeInstanceOf(CacheListConcatenateBack.Success);
        }, `expected a SUCCESS but got ${respConcat.toString()}`);
        expect(
          (respConcat as CacheListConcatenateBack.Success).listLength()
        ).toEqual(values1.length);

        let respFetch = await cacheClient.listFetch(
          integrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          values1
        );

        respConcat = await cacheClient.listConcatenateBack(
          integrationTestCacheName,
          listName,
          values2
        );
        expectWithMessage(() => {
          expect(respConcat).toBeInstanceOf(CacheListConcatenateBack.Success);
        }, `expected a SUCCESS but got ${respConcat.toString()}`);
        expect(
          (respConcat as CacheListConcatenateBack.Success).listLength()
        ).toEqual(values1.length + values2.length);

        respFetch = await cacheClient.listFetch(
          integrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          values1.concat(values2)
        );
      });

      it('listConcatenateFront adds multiple values', async () => {
        const listName = v4();
        const values1 = ['1', '2', '3', '4'];
        const values2 = ['this', 'that'];

        let respConcat = await cacheClient.listConcatenateFront(
          integrationTestCacheName,
          listName,
          values1
        );
        expectWithMessage(() => {
          expect(respConcat).toBeInstanceOf(CacheListConcatenateFront.Success);
        }, `expected a SUCCESS but got ${respConcat.toString()}`);
        expect(
          (respConcat as CacheListConcatenateFront.Success).listLength()
        ).toEqual(values1.length);

        let respFetch = await cacheClient.listFetch(
          integrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          values1
        );

        respConcat = await cacheClient.listConcatenateFront(
          integrationTestCacheName,
          listName,
          values2
        );
        expectWithMessage(() => {
          expect(respConcat).toBeInstanceOf(CacheListConcatenateFront.Success);
        }, `expected a SUCCESS but got ${respConcat.toString()}`);
        expect(
          (respConcat as CacheListConcatenateFront.Success).listLength()
        ).toEqual(values1.length + values2.length);

        respFetch = await cacheClient.listFetch(
          integrationTestCacheName,
          listName
        );
        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          values2.concat(values1)
        );
      });

      it('listRetain returns Success if the list exists', async () => {
        const listName = v4();
        const valueString = ['a', 'b', 'c', '1', '2', '3'];
        const valueStringExpected = ['b'];
        const valueBytesExpected = new Uint8Array([98]);

        const listPushResponse = await cacheClient.listConcatenateBack(
          integrationTestCacheName,
          listName,
          valueString
        );

        expectWithMessage(() => {
          expect(listPushResponse).toBeInstanceOf(
            CacheListConcatenateBack.Success
          );
        }, `expected a SUCCESS but got ${listPushResponse.toString()}`);

        const retainOptions = {
          startIndex: 1,
          endIndex: 2,
        };

        const respRetain = await cacheClient.listRetain(
          integrationTestCacheName,
          listName,
          retainOptions
        );
        expectWithMessage(() => {
          expect(respRetain).toBeInstanceOf(CacheListRetain.Success);
        }, `expected a SUCCESS but got ${respRetain.toString()}`);

        const respFetch = await cacheClient.listFetch(
          integrationTestCacheName,
          listName
        );

        expectWithMessage(() => {
          expect(respFetch).toBeInstanceOf(CacheListFetch.Hit);
        }, `expected a HIT but got ${respFetch.toString()}`);
        expect((respFetch as CacheListFetch.Hit).valueListString()).toEqual(
          valueStringExpected
        );
        expect((respFetch as CacheListFetch.Hit).valueList()).toEqual(
          valueStringExpected
        );
        expect((respFetch as CacheListFetch.Hit).valueListUint8Array()).toEqual(
          [valueBytesExpected]
        );
      });
    });

    // set

    describe('set', () => {
      it('addElements and setFetch for string arrays', async () => {
        const setName = v4();
        const addResponse = await cacheClient.setAddElements(
          integrationTestCacheName,
          setName,
          ['lol', 'foo']
        );
        expectWithMessage(() => {
          expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
        }, `expected SUCCESS but got ${addResponse.toString()}`);

        const fetchResponse = await cacheClient.setFetch(
          integrationTestCacheName,
          setName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);
        const hit = fetchResponse as CacheSetFetch.Hit;
        expect(hit.valueSet()).toEqual(new Set(['lol', 'foo']));
        expect(hit.valueSetString()).toEqual(new Set(['lol', 'foo']));
        expect(hit.valueArray()).toBeArrayOfSize(2);
        expect(hit.valueArray()).toContainAllValues(['lol', 'foo']);
        expect(hit.valueArrayString()).toBeArrayOfSize(2);
        expect(hit.valueArrayString()).toContainAllValues(['lol', 'foo']);
      });

      it('setContainsElements should be a hit when the set contains some of the elements', async () => {
        const setName = v4();
        const addResponse = await cacheClient.setAddElements(
          integrationTestCacheName,
          setName,
          ['foo', 'bar']
        );
        expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);

        const response = await cacheClient.setContainsElements(
          integrationTestCacheName,
          setName,
          ['foo', 'baz']
        );
        expect(response).toBeInstanceOf(CacheSetContainsElements.Hit);
        expect(response.containsElements()).toEqual({
          foo: true,
          baz: false,
        });
      });

      it('removeElements for string arrays', async () => {
        const setName = v4();
        const addResponse = await cacheClient.setAddElements(
          integrationTestCacheName,
          setName,
          ['lol', 'foo']
        );
        expectWithMessage(() => {
          expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
        }, `expected SUCCESS but got ${addResponse.toString()}`);

        const removeResponse = await cacheClient.setRemoveElements(
          integrationTestCacheName,
          setName,
          ['foo']
        );
        expectWithMessage(() => {
          expect(removeResponse).toBeInstanceOf(CacheSetRemoveElements.Success);
        }, `expected SUCCESS but got ${removeResponse.toString()}`);

        const fetchResponse = await cacheClient.setFetch(
          integrationTestCacheName,
          setName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSetFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);
        expect((fetchResponse as CacheSetFetch.Hit).valueSetString()).toEqual(
          new Set(['lol'])
        );
      });

      it('setSample should return HIT when set exists', async () => {
        // Add some elements
        const setName = v4();
        const elements = [
          'apples',
          'bananas',
          'carrots',
          'dates',
          'elderberries',
        ];
        const addResponse = await cacheClient.setAddElements(
          integrationTestCacheName,
          setName,
          elements
        );
        expectWithMessage(() => {
          expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
        }, `expected SUCCESS but got ${addResponse.toString()}`);

        // Fetch with sample size 0
        const responseZero = await cacheClient.setSample(
          integrationTestCacheName,
          setName,
          0
        );
        expectWithMessage(() => {
          expect(responseZero).toBeInstanceOf(CacheSetSample.Hit);
        }, `expected HIT but got ${responseZero.toString()}`);

        // Fetch with sample size < set size
        const responseLess = await cacheClient.setSample(
          integrationTestCacheName,
          setName,
          3
        );
        expectWithMessage(() => {
          expect(responseLess).toBeInstanceOf(CacheSetSample.Hit);
        }, `expected HIT but got ${responseLess.toString()}`);
        const valuesArrayLess = (
          responseLess as CacheSetSample.Hit
        ).valueArray();
        expect(valuesArrayLess).toBeArrayOfSize(3);
        for (const value of valuesArrayLess) {
          expect(elements).toContain(value);
        }

        // Fetch with sample size == set size
        const responseEqual = await cacheClient.setSample(
          integrationTestCacheName,
          setName,
          5
        );
        expectWithMessage(() => {
          expect(responseEqual).toBeInstanceOf(CacheSetSample.Hit);
        }, `expected HIT but got ${responseEqual.toString()}`);
        const valuesArrayEqual = (
          responseEqual as CacheSetSample.Hit
        ).valueArray();
        expect(valuesArrayEqual).toBeArrayOfSize(5);
        for (const value of valuesArrayEqual) {
          expect(elements).toContain(value);
        }

        // Fetch with sample size > set size
        const responseMore = await cacheClient.setSample(
          integrationTestCacheName,
          setName,
          10
        );
        expectWithMessage(() => {
          expect(responseMore).toBeInstanceOf(CacheSetSample.Hit);
        }, `expected HIT but got ${responseMore.toString()}`);
        const valuesArrayMore = (
          responseMore as CacheSetSample.Hit
        ).valueArray();
        expect(valuesArrayMore).toBeArrayOfSize(5);
        for (const value of valuesArrayMore) {
          expect(elements).toContain(value);
        }
      });

      it('setPop and setLength should return HIT when set exists', async () => {
        // Add some elements
        const setName = v4();
        const elements = [
          'apples',
          'bananas',
          'carrots',
          'dates',
          'elderberries',
        ];
        const addResponse = await cacheClient.setAddElements(
          integrationTestCacheName,
          setName,
          elements
        );
        expectWithMessage(() => {
          expect(addResponse).toBeInstanceOf(CacheSetAddElements.Success);
        }, `expected SUCCESS but got ${addResponse.toString()}`);

        const responseLess = await cacheClient.setPop(
          integrationTestCacheName,
          setName,
          3
        );
        expectWithMessage(() => {
          expect(responseLess).toBeInstanceOf(CacheSetPop.Hit);
        }, `expected HIT but got ${responseLess.toString()}`);
        const valuesArrayLess = (responseLess as CacheSetPop.Hit).valueArray();
        expect(valuesArrayLess).toBeArrayOfSize(3);
        for (const value of valuesArrayLess) {
          expect(elements).toContain(value);
        }

        const lengthResponse = await cacheClient.setLength(
          integrationTestCacheName,
          setName
        );
        expectWithMessage(() => {
          expect(lengthResponse).toBeInstanceOf(CacheSetLength.Hit);
        }, `expected HIT but got ${lengthResponse.toString()}`);
        expect((lengthResponse as CacheSetLength.Hit).length()).toEqual(2);
      });
    });

    // sorted set

    describe('sorted set', () => {
      it('sortedSetPutElements should store elements with a string values passed via Map', async () => {
        const sortedSetName = v4();
        const putResponse = await cacheClient.sortedSetPutElements(
          integrationTestCacheName,
          sortedSetName,
          new Map([
            ['foo', 42],
            ['bar', 84],
          ])
        );
        expectWithMessage(() => {
          expect(putResponse).toBeInstanceOf(CacheSortedSetPutElements.Success);
        }, `expected SUCCESS but got ${putResponse.toString()}`);

        const fetchResponse = await cacheClient.sortedSetFetchByRank(
          integrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);
        const hitResponse = fetchResponse as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([
          {value: 'foo', score: 42},
          {value: 'bar', score: 84},
        ]);
      });

      it('sortedSetLength returns the length if the sorted set exists', async () => {
        const sortedSetName = v4();
        const setValues = {foo: 42, bar: 84, baz: 90210};
        const numElements = Object.keys(setValues).length;
        await cacheClient.sortedSetPutElements(
          integrationTestCacheName,
          sortedSetName,
          setValues
        );

        const result = await cacheClient.sortedSetLength(
          integrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetLength.Hit);
        }, `expected HIT but got ${result.toString()}`);
        expect((result as CacheSortedSetLength.Hit).length()).toEqual(
          numElements
        );
      });

      it('sortedSetLengthByScore gets the length for scores between lower and upper bound', async () => {
        const sortedSetName = v4();
        const setValues = {
          foo: 42,
          bar: 42,
          baz: 42,
          apple: 1,
          banana: 1,
          water: 555,
          air: 555,
          earth: 555,
          fire: 555,
        };
        await cacheClient.sortedSetPutElements(
          integrationTestCacheName,
          sortedSetName,
          setValues
        );

        const scoreRange = {
          minScore: 1,
          maxScore: 42,
        };
        const result = await cacheClient.sortedSetLengthByScore(
          integrationTestCacheName,
          sortedSetName,
          scoreRange
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetLengthByScore.Hit);
        }, `expected HIT but got ${result.toString()}`);
        expect((result as CacheSortedSetLengthByScore.Hit).length()).toEqual(5);
      });

      it('sortedSetUnionStore should store all distinct elements from the source sets', async () => {
        const sourceSets: SortedSetSource[] = [
          {sortedSetName: v4(), weight: 1.0},
          {sortedSetName: v4(), weight: 2.5},
        ];
        const field1 = 'foo';
        const field2 = 'bar';
        const field3 = 'abc';
        const field4 = 'def';
        const put1 = await cacheClient.sortedSetPutElements(
          integrationTestCacheName,
          sourceSets[0].sortedSetName,
          new Map([
            [field1, 1],
            [field2, 2],
          ])
        );
        expectWithMessage(() => {
          expect(put1).toBeInstanceOf(CacheSortedSetPutElements.Success);
        }, `expected Success but got ${put1.toString()}`);

        const put2 = await cacheClient.sortedSetPutElements(
          integrationTestCacheName,
          sourceSets[1].sortedSetName,
          new Map([
            [field3, 3],
            [field4, 4],
          ])
        );
        expectWithMessage(() => {
          expect(put2).toBeInstanceOf(CacheSortedSetPutElements.Success);
        }, `expected Success but got ${put2.toString()}`);

        const destSetName = v4();
        const response = await cacheClient.sortedSetUnionStore(
          integrationTestCacheName,
          destSetName,
          sourceSets
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetUnionStore.Success);
        }, `expected Success but got ${response.toString()}`);
        const successResponse = response as CacheSortedSetUnionStore.Success;
        expect(successResponse.length()).toEqual(4);

        const scores = await cacheClient.sortedSetGetScores(
          integrationTestCacheName,
          destSetName,
          [field1, field2, field3, field4]
        );
        expectWithMessage(() => {
          expect(scores).toBeInstanceOf(CacheSortedSetGetScores.Hit);
        }, `expected HIT but got ${scores.toString()}`);
        const expectedScores = {foo: 1, bar: 2, abc: 7.5, def: 10};
        expect(scores.value()).toEqual(expectedScores);
      });

      it('sortedSetRemoveElements should remove string values', async () => {
        const sortedSetName = v4();
        await cacheClient.sortedSetPutElements(
          integrationTestCacheName,
          sortedSetName,
          {
            foo: 21,
            bar: 42,
            baz: 84,
          }
        );

        const removeResponse = await cacheClient.sortedSetRemoveElements(
          integrationTestCacheName,
          sortedSetName,
          ['foo', 'baz']
        );
        expectWithMessage(() => {
          expect(removeResponse).toBeInstanceOf(
            CacheSortedSetRemoveElements.Success
          );
        }, `expected SUCCESS but got ${removeResponse.toString()}`);

        const fetchResponse = await cacheClient.sortedSetFetchByRank(
          integrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);
        const hitResponse = fetchResponse as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([{value: 'bar', score: 42}]);
      });

      it('sortedSetIncrementScore creates sorted set and element if they do not exist', async () => {
        const sortedSetName = v4();
        let fetchResponse = await cacheClient.sortedSetFetchByRank(
          integrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Miss);
        }, `expected MISS but got ${fetchResponse.toString()}`);

        let incrementResponse = await cacheClient.sortedSetIncrementScore(
          integrationTestCacheName,
          sortedSetName,
          'foo'
        );
        expectWithMessage(() => {
          expect(incrementResponse).toBeInstanceOf(
            CacheSortedSetIncrementScore.Success
          );
        }, `expected SUCCESS but got ${incrementResponse.toString()}`);
        let successResponse =
          incrementResponse as CacheSortedSetIncrementScore.Success;
        expect(successResponse.score()).toEqual(1);

        fetchResponse = await cacheClient.sortedSetFetchByRank(
          integrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);
        const hitResponse = fetchResponse as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([
          {
            value: 'foo',
            score: 1,
          },
        ]);

        incrementResponse = await cacheClient.sortedSetIncrementScore(
          integrationTestCacheName,
          sortedSetName,
          'bar',
          42
        );

        expectWithMessage(() => {
          expect(incrementResponse).toBeInstanceOf(
            CacheSortedSetIncrementScore.Success
          );
        }, `expected SUCCESS but got ${incrementResponse.toString()}`);
        successResponse =
          incrementResponse as CacheSortedSetIncrementScore.Success;
        expect(successResponse.score()).toEqual(42);

        fetchResponse = await cacheClient.sortedSetFetchByRank(
          integrationTestCacheName,
          sortedSetName
        );

        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);
        const hitResponse2 = fetchResponse as CacheSortedSetFetch.Hit;
        expect(hitResponse2.valueArray()).toEqual([
          {value: 'foo', score: 1},
          {value: 'bar', score: 42},
        ]);
      });

      it('sortedSetIncrementScore increments an existing field by the expected amount for a string value', async () => {
        const sortedSetName = v4();
        const value = 'foo';
        await cacheClient.sortedSetPutElement(
          integrationTestCacheName,
          sortedSetName,
          value,
          90210
        );

        const incrementResponse = await cacheClient.sortedSetIncrementScore(
          integrationTestCacheName,
          sortedSetName,
          value,
          10
        );
        expectWithMessage(() => {
          expect(incrementResponse).toBeInstanceOf(
            CacheSortedSetIncrementScore.Success
          );
        }, `expected SUCCESS but got ${incrementResponse.toString()}`);
        const successResponse =
          incrementResponse as CacheSortedSetIncrementScore.Success;
        expect(successResponse.score()).toEqual(90220);

        const fetchResponse = await cacheClient.sortedSetFetchByRank(
          integrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(fetchResponse).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${fetchResponse.toString()}`);
        const hitResponse = fetchResponse as CacheSortedSetFetch.Hit;
        expect(hitResponse.valueArray()).toEqual([
          {value: value, score: 90220},
        ]);
      });

      it('sortedSetGetScores retrieves scores for values that exist', async () => {
        const sortedSetName = v4();
        await cacheClient.sortedSetPutElements(
          integrationTestCacheName,
          sortedSetName,
          {foo: 42, bar: 84, baz: 90210}
        );

        const result = await cacheClient.sortedSetGetScores(
          integrationTestCacheName,
          sortedSetName,
          ['bar', 'baz']
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetGetScores.Hit);
        }, `expected HIT but got ${result.toString()}`);
        const hitResult = result as CacheSortedSetGetScores.Hit;
        expect(hitResult.valueRecord()).toEqual({
          bar: 84,
          baz: 90210,
        });
      });

      it('sortedSetGetRank retrieves rank for a value that exists', async () => {
        const sortedSetName = v4();
        await cacheClient.sortedSetPutElements(
          integrationTestCacheName,
          sortedSetName,
          {foo: 42, bar: 84, baz: 90210}
        );

        let result = await cacheClient.sortedSetGetRank(
          integrationTestCacheName,
          sortedSetName,
          'bar'
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetGetRank.Hit);
        }, `expected HIT but got ${result.toString()}`);
        let hitResult = result as CacheSortedSetGetRank.Hit;
        expect(hitResult.rank()).toEqual(1);

        result = await cacheClient.sortedSetGetRank(
          integrationTestCacheName,
          sortedSetName,
          'baz'
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetGetRank.Hit);
        }, `expected HIT but got ${result.toString()}`);
        hitResult = result as CacheSortedSetGetRank.Hit;
        expect(hitResult.rank()).toEqual(2);

        result = await cacheClient.sortedSetGetRank(
          integrationTestCacheName,
          sortedSetName,
          'foo'
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetGetRank.Hit);
        }, `expected HIT but got ${result.toString()}`);
        hitResult = result as CacheSortedSetGetRank.Hit;
        expect(hitResult.rank()).toEqual(0);

        result = await cacheClient.sortedSetGetRank(
          integrationTestCacheName,
          sortedSetName,
          'foo',
          {
            order: SortedSetOrder.Descending,
          }
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetGetRank.Hit);
        }, `expected HIT but got ${result.toString()}`);
        hitResult = result as CacheSortedSetGetRank.Hit;
        expect(hitResult.rank()).toEqual(2);

        result = await cacheClient.sortedSetGetRank(
          integrationTestCacheName,
          sortedSetName,
          'foo',
          {
            order: SortedSetOrder.Ascending,
          }
        );
        expectWithMessage(() => {
          expect(result).toBeInstanceOf(CacheSortedSetGetRank.Hit);
        }, `expected HIT but got ${result.toString()}`);
        hitResult = result as CacheSortedSetGetRank.Hit;
        expect(hitResult.rank()).toEqual(0);
      });

      it('sortedSetFetchByScore should return expected toString value', async () => {
        const sortedSetName = v4();
        await cacheClient.sortedSetPutElement(
          integrationTestCacheName,
          sortedSetName,
          'a',
          42
        );
        const response = await cacheClient.sortedSetFetchByScore(
          integrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        expect((response as CacheSortedSetFetch.Hit).toString()).toEqual(
          'Hit: valueArrayStringElements: a: 42'
        );
      });

      it('sortedSetFetchByRank should return expected toString value with sortedSetFetch', async () => {
        const sortedSetName = v4();
        await cacheClient.sortedSetPutElement(
          integrationTestCacheName,
          sortedSetName,
          'a',
          42
        );
        const response = await cacheClient.sortedSetFetchByRank(
          integrationTestCacheName,
          sortedSetName
        );
        expectWithMessage(() => {
          expect(response).toBeInstanceOf(CacheSortedSetFetch.Hit);
        }, `expected HIT but got ${response.toString()}`);
        expect((response as CacheSortedSetFetch.Hit).toString()).toEqual(
          'Hit: valueArrayStringElements: a: 42'
        );
      });
    });
  });
}
