import {SetupIntegrationTest} from '../integration-setup';
import {v4} from 'uuid';
import {
  CacheDecreaseTtlResponse,
  CacheDeleteResponse,
  CacheDictionaryFetchResponse,
  CacheDictionaryGetFieldResponse,
  CacheDictionaryGetFieldsResponse,
  CacheDictionaryIncrementResponse,
  CacheDictionaryLengthResponse,
  CacheDictionaryRemoveFieldResponse,
  CacheDictionaryRemoveFieldsResponse,
  CacheDictionarySetFieldResponse,
  CacheDictionarySetFieldsResponse,
  CacheGetBatchResponse,
  CacheGetResponse,
  CacheGetWithHashResponse,
  CacheIncreaseTtlResponse,
  CacheIncrementResponse,
  CacheItemGetTtlResponse,
  CacheItemGetTypeResponse,
  CacheKeyExistsResponse,
  CacheKeysExistResponse,
  CacheListConcatenateBackResponse,
  CacheListConcatenateFrontResponse,
  CacheListFetchResponse,
  CacheListLengthResponse,
  CacheListPopBackResponse,
  CacheListPopFrontResponse,
  CacheListPushBackResponse,
  CacheListPushFrontResponse,
  CacheListRemoveValueResponse,
  CacheListRetainResponse,
  CacheSetAddElementResponse,
  CacheSetAddElementsResponse,
  CacheSetBatchResponse,
  CacheSetContainsElementResponse,
  CacheSetContainsElementsResponse,
  CacheSetFetchResponse,
  CacheSetIfAbsentOrEqualResponse,
  CacheSetIfAbsentOrHashEqualResponse,
  CacheSetIfAbsentOrHashNotEqualResponse,
  CacheSetIfAbsentResponse,
  CacheSetIfEqualResponse,
  CacheSetIfNotEqualResponse,
  CacheSetIfPresentAndHashEqualResponse,
  CacheSetIfPresentAndHashNotEqualResponse,
  CacheSetIfPresentAndNotEqualResponse,
  CacheSetIfPresentResponse,
  CacheSetLengthResponse,
  CacheSetPopResponse,
  CacheSetRemoveElementsResponse,
  CacheSetResponse,
  CacheSetSampleResponse,
  CacheSetWithHash,
  CacheSetWithHashResponse,
  CacheSortedSetFetchResponse,
  CacheSortedSetGetRankResponse,
  CacheSortedSetGetScoreResponse,
  CacheSortedSetGetScoresResponse,
  CacheSortedSetIncrementScoreResponse,
  CacheSortedSetLengthByScoreResponse,
  CacheSortedSetLengthResponse,
  CacheSortedSetPutElementResponse,
  CacheSortedSetPutElementsResponse,
  CacheSortedSetRemoveElementResponse,
  CacheSortedSetRemoveElementsResponse,
  CacheSortedSetUnionStoreResponse,
  CacheUpdateTtlResponse,
  CreateCacheResponse,
  DeleteCacheResponse,
  FlushCacheResponse,
  ListCachesResponse,
  SortedSetSource,
} from '@gomomento/sdk-core';

const {cacheClient, cacheClientWithoutRetryStrategy, integrationTestCacheName} =
  SetupIntegrationTest();

const numTrials = 3;

async function testTrials(trial: Promise<boolean>) {
  const trials = [];
  for (let i = 0; i < numTrials; i++) {
    trials.push(trial);
  }
  const results = await Promise.all(trials);
  // expect at least one of the trials to pass (i.e. return true)
  expect(results.some(result => result)).toBe(true);
}

describe('AbortSignal', () => {
  describe('cache client WITHOUT retry strategy', () => {
    it('should cancel a set call', async () => {
      const testSet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.set(
          integrationTestCacheName,
          v4(),
          'value',
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testSet());
    });

    it('should cancel a get call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const getResponse = await cacheClientWithoutRetryStrategy.get(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          getResponse.type === CacheGetResponse.Error &&
          getResponse.errorCode() === 'CANCELLED_ERROR' &&
          getResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setWithHash call', async () => {
      const testSetWithHash = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setWithHashResponse =
          await cacheClientWithoutRetryStrategy.setWithHash(
            integrationTestCacheName,
            v4(),
            'value',
            {
              abortSignal,
            }
          );
        if (
          setWithHashResponse.type === CacheSetWithHashResponse.Error &&
          setWithHashResponse.errorCode() === 'CANCELLED_ERROR' &&
          setWithHashResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testSetWithHash());
    });
    it('should cancel a getWithHash call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const getWithHashResponse =
          await cacheClientWithoutRetryStrategy.getWithHash(
            integrationTestCacheName,
            v4(),
            {
              abortSignal,
            }
          );
        if (
          getWithHashResponse.type === CacheGetWithHashResponse.Error &&
          getWithHashResponse.errorCode() === 'CANCELLED_ERROR' &&
          getWithHashResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setFetch call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setFetchResponse = await cacheClientWithoutRetryStrategy.setFetch(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setFetchResponse.type === CacheSetFetchResponse.Error &&
          setFetchResponse.errorCode() === 'CANCELLED_ERROR' &&
          setFetchResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setAddElement call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setAddElementResponse =
          await cacheClientWithoutRetryStrategy.setAddElement(
            integrationTestCacheName,
            v4(),
            'element',
            {
              abortSignal,
            }
          );
        if (
          setAddElementResponse.type === CacheSetAddElementResponse.Error &&
          setAddElementResponse.errorCode() === 'CANCELLED_ERROR' &&
          setAddElementResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setAddElements call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setAddElementsResponse =
          await cacheClientWithoutRetryStrategy.setAddElements(
            integrationTestCacheName,
            v4(),
            ['element1', 'element2'],
            {
              abortSignal,
            }
          );
        if (
          setAddElementsResponse.type === CacheSetAddElementsResponse.Error &&
          setAddElementsResponse.errorCode() === 'CANCELLED_ERROR' &&
          setAddElementsResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setContainsElement call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.setContainsElement(
            integrationTestCacheName,
            v4(),
            'element1',
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSetContainsElementResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setContainsElements call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.setContainsElements(
            integrationTestCacheName,
            v4(),
            ['element1', 'element2'],
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSetContainsElementsResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setRemoveElements call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.setRemoveElements(
            integrationTestCacheName,
            v4(),
            ['element1', 'element2'],
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSetRemoveElementsResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setSample call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.setSample(
          integrationTestCacheName,
          v4(),
          1000,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetSampleResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setPop call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.setPop(
          integrationTestCacheName,
          v4(),
          1000,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetPopResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setLength call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.setLength(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetLengthResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfAbsent call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.setIfAbsent(
          integrationTestCacheName,
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetIfAbsentResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfPresent call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.setIfPresent(
          integrationTestCacheName,
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetIfPresentResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfEqual call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.setIfEqual(
          integrationTestCacheName,
          v4(),
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetIfEqualResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfNotEqual call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.setIfNotEqual(
          integrationTestCacheName,
          v4(),
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetIfNotEqualResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfPresentAndNotEqual call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.setIfPresentAndNotEqual(
            integrationTestCacheName,
            v4(),
            v4(),
            v4(),
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSetIfPresentAndNotEqualResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfAbsentOrEqual call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.setIfAbsentOrEqual(
            integrationTestCacheName,
            v4(),
            v4(),
            v4(),
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSetIfAbsentOrEqualResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfPresentAndHashEqual call', async () => {
      const testSetHash = await cacheClientWithoutRetryStrategy.setWithHash(
        integrationTestCacheName,
        v4(),
        v4()
      );
      const hashValue =
        testSetHash instanceof CacheSetWithHash.Stored
          ? testSetHash.hashUint8Array()
          : new TextEncoder().encode(v4());
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.setIfPresentAndHashEqual(
            integrationTestCacheName,
            v4(),
            v4(),
            hashValue,
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSetIfPresentAndHashEqualResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfPresentAndHashNotEqual call', async () => {
      const testSetHash = await cacheClientWithoutRetryStrategy.setWithHash(
        integrationTestCacheName,
        v4(),
        v4()
      );
      const hashValue =
        testSetHash instanceof CacheSetWithHash.Stored
          ? testSetHash.hashUint8Array()
          : new TextEncoder().encode(v4());
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.setIfPresentAndHashNotEqual(
            integrationTestCacheName,
            v4(),
            v4(),
            hashValue,
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSetIfPresentAndHashNotEqualResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfAbsentOrHashEqual call', async () => {
      const testSetHash = await cacheClientWithoutRetryStrategy.setWithHash(
        integrationTestCacheName,
        v4(),
        v4()
      );
      const hashValue =
        testSetHash instanceof CacheSetWithHash.Stored
          ? testSetHash.hashUint8Array()
          : new TextEncoder().encode(v4());
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.setIfAbsentOrHashEqual(
            integrationTestCacheName,
            v4(),
            v4(),
            hashValue,
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSetIfAbsentOrHashEqualResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfAbsentOrHashNotEqual call', async () => {
      const testSetHash = await cacheClientWithoutRetryStrategy.setWithHash(
        integrationTestCacheName,
        v4(),
        v4()
      );
      const hashValue =
        testSetHash instanceof CacheSetWithHash.Stored
          ? testSetHash.hashUint8Array()
          : new TextEncoder().encode(v4());
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.setIfAbsentOrHashNotEqual(
            integrationTestCacheName,
            v4(),
            v4(),
            hashValue,
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSetIfAbsentOrHashNotEqualResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a delete call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const deleteResponse = await cacheClientWithoutRetryStrategy.delete(
          integrationTestCacheName,
          v4(),
          {abortSignal}
        );
        if (
          deleteResponse.type === CacheDeleteResponse.Error &&
          deleteResponse.errorCode() === 'CANCELLED_ERROR' &&
          deleteResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a getBatch call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.getBatch(
          integrationTestCacheName,
          [v4()],
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheGetBatchResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setBatch call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.setBatch(
          integrationTestCacheName,
          new Map<string, string>([
            ['a', 'apple'],
            ['b', 'berry'],
          ]),
          {abortSignal: abortSignal}
        );
        if (
          setResponse.type === CacheSetBatchResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listConcatenateBack call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.listConcatenateBack(
            integrationTestCacheName,
            v4(),
            [v4()],
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheListConcatenateBackResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listConcatenateFront call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.listConcatenateFront(
            integrationTestCacheName,
            v4(),
            [v4()],
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheListConcatenateFrontResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listFetch call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.listFetch(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheListFetchResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listRetain call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.listRetain(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheListRetainResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listLength call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.listLength(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheListLengthResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listPopBack call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.listPopBack(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheListPopBackResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listPopFront call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.listPopFront(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheListPopFrontResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listPushBack call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.listPushBack(
          integrationTestCacheName,
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheListPushBackResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listPushFront call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.listPushFront(
          integrationTestCacheName,
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheListPushFrontResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listRemoveValue call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.listRemoveValue(
            integrationTestCacheName,
            v4(),
            v4(),
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheListRemoveValueResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a dictionaryFetch call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.dictionaryFetch(
            integrationTestCacheName,
            v4(),
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheDictionaryFetchResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a dictionarySetField call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.dictionarySetField(
            integrationTestCacheName,
            v4(),
            v4(),
            v4(),
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheDictionarySetFieldResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a dictionarySetFields call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.dictionarySetFields(
            integrationTestCacheName,
            v4(),
            new Map<string, string>([['a', 'b']]),
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheDictionarySetFieldsResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a dictionaryGetField call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.dictionaryGetField(
            integrationTestCacheName,
            v4(),
            v4(),
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheDictionaryGetFieldResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a dictionaryGetFields call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.dictionaryGetFields(
            integrationTestCacheName,
            v4(),
            ['a', 'b'],
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheDictionaryGetFieldsResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a dictionaryRemoveField call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.dictionaryRemoveField(
            integrationTestCacheName,
            v4(),
            v4(),
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheDictionaryRemoveFieldResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a dictionaryRemoveFields call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.dictionaryRemoveFields(
            integrationTestCacheName,
            v4(),
            ['a', 'b'],
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheDictionaryRemoveFieldsResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a dictionaryLength call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.dictionaryLength(
            integrationTestCacheName,
            v4(),
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheDictionaryLengthResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a increment call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.increment(
          integrationTestCacheName,
          v4(),
          5,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheIncrementResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a dictionaryIncrement call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.dictionaryIncrement(
            integrationTestCacheName,
            v4(),
            v4(),
            5,
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheDictionaryIncrementResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetPutElement call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.sortedSetPutElement(
            integrationTestCacheName,
            v4(),
            v4(),
            50,
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSortedSetPutElementResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetPutElements call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.sortedSetPutElements(
            integrationTestCacheName,
            v4(),
            [['val', 10]],
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSortedSetPutElementsResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetFetchByRank call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.sortedSetFetchByRank(
            integrationTestCacheName,
            v4(),
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSortedSetFetchResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetFetchByScore call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.sortedSetFetchByScore(
            integrationTestCacheName,
            v4(),
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSortedSetFetchResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetGetRank call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.sortedSetGetRank(
            integrationTestCacheName,
            v4(),
            v4(),
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSortedSetGetRankResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetGetScore call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.sortedSetGetScore(
            integrationTestCacheName,
            v4(),
            v4(),
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSortedSetGetScoreResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetGetScores call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.sortedSetGetScores(
            integrationTestCacheName,
            v4(),
            [v4()],
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSortedSetGetScoresResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetIncrementScore call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.sortedSetIncrementScore(
            integrationTestCacheName,
            v4(),
            v4(),
            5,
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSortedSetIncrementScoreResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetRemoveElement call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.sortedSetRemoveElement(
            integrationTestCacheName,
            v4(),
            v4(),
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSortedSetRemoveElementResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetRemoveElements call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.sortedSetRemoveElements(
            integrationTestCacheName,
            v4(),
            [v4()],
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSortedSetRemoveElementsResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetLength call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.sortedSetLength(
            integrationTestCacheName,
            v4(),
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSortedSetLengthResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetLengthByScore call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.sortedSetLengthByScore(
            integrationTestCacheName,
            v4(),
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSortedSetLengthByScoreResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetUnionStore call', async () => {
      const sourceSets: SortedSetSource[] = [
        {sortedSetName: 'set1', weight: 1},
        {sortedSetName: 'set2', weight: -1},
      ];
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse =
          await cacheClientWithoutRetryStrategy.sortedSetUnionStore(
            integrationTestCacheName,
            v4(),
            sourceSets,
            {
              abortSignal,
            }
          );
        if (
          setResponse.type === CacheSortedSetUnionStoreResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a itemGetType call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.itemGetType(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheItemGetTypeResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a itemGetTtl call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.itemGetTtl(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheItemGetTtlResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a keyExists call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.keyExists(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheKeyExistsResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a updateTtl call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.updateTtl(
          integrationTestCacheName,
          v4(),
          100,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheUpdateTtlResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a keysExist call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.keysExist(
          integrationTestCacheName,
          [v4()],
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheKeysExistResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a increaseTtl call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.increaseTtl(
          integrationTestCacheName,
          v4(),
          50,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheIncreaseTtlResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a decreaseTtl call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.decreaseTtl(
          integrationTestCacheName,
          v4(),
          50,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheDecreaseTtlResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a createCache call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.createCache(
          integrationTestCacheName,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CreateCacheResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a deleteCache call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.deleteCache(
          integrationTestCacheName,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === DeleteCacheResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a flushCache call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.flushCache(
          integrationTestCacheName,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === FlushCacheResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listCaches call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.listCaches({
          abortSignal,
        });
        if (
          setResponse.type === ListCachesResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
  });

  describe('cache client WITH default retry strategy', () => {
    it('should cancel a set call', async () => {
      const testSet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.set(
          integrationTestCacheName,
          v4(),
          'value',
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testSet());
    });

    it('should cancel a get call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const getResponse = await cacheClient.get(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          getResponse.type === CacheGetResponse.Error &&
          getResponse.errorCode() === 'CANCELLED_ERROR' &&
          getResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setWithHash call', async () => {
      const testSetWithHash = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setWithHashResponse =
          await cacheClientWithoutRetryStrategy.setWithHash(
            integrationTestCacheName,
            v4(),
            'value',
            {
              abortSignal,
            }
          );
        if (
          setWithHashResponse.type === CacheSetWithHashResponse.Error &&
          setWithHashResponse.errorCode() === 'CANCELLED_ERROR' &&
          setWithHashResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testSetWithHash());
    });
    it('should cancel a getWithHash call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const getWithHashResponse = await cacheClient.getWithHash(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          getWithHashResponse.type === CacheGetWithHashResponse.Error &&
          getWithHashResponse.errorCode() === 'CANCELLED_ERROR' &&
          getWithHashResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setFetch call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setFetchResponse = await cacheClient.setFetch(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setFetchResponse.type === CacheSetFetchResponse.Error &&
          setFetchResponse.errorCode() === 'CANCELLED_ERROR' &&
          setFetchResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setAddElement call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setAddElementResponse = await cacheClient.setAddElement(
          integrationTestCacheName,
          v4(),
          'element',
          {
            abortSignal,
          }
        );
        if (
          setAddElementResponse.type === CacheSetAddElementResponse.Error &&
          setAddElementResponse.errorCode() === 'CANCELLED_ERROR' &&
          setAddElementResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setAddElements call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setAddElementsResponse = await cacheClient.setAddElements(
          integrationTestCacheName,
          v4(),
          ['element1', 'element2'],
          {
            abortSignal,
          }
        );
        if (
          setAddElementsResponse.type === CacheSetAddElementsResponse.Error &&
          setAddElementsResponse.errorCode() === 'CANCELLED_ERROR' &&
          setAddElementsResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setContainsElement call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.setContainsElement(
          integrationTestCacheName,
          v4(),
          'element1',
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetContainsElementResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setContainsElements call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.setContainsElements(
          integrationTestCacheName,
          v4(),
          ['element1', 'element2'],
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetContainsElementsResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setRemoveElements call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.setRemoveElements(
          integrationTestCacheName,
          v4(),
          ['element1', 'element2'],
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetRemoveElementsResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setSample call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.setSample(
          integrationTestCacheName,
          v4(),
          1000,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetSampleResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setPop call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.setPop(
          integrationTestCacheName,
          v4(),
          1000,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetPopResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setLength call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.setLength(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetLengthResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfAbsent call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.setIfAbsent(
          integrationTestCacheName,
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetIfAbsentResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfPresent call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.setIfPresent(
          integrationTestCacheName,
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetIfPresentResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfEqual call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.setIfEqual(
          integrationTestCacheName,
          v4(),
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetIfEqualResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfNotEqual call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.setIfNotEqual(
          integrationTestCacheName,
          v4(),
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetIfNotEqualResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfPresentAndNotEqual call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.setIfPresentAndNotEqual(
          integrationTestCacheName,
          v4(),
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetIfPresentAndNotEqualResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfAbsentOrEqual call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.setIfAbsentOrEqual(
          integrationTestCacheName,
          v4(),
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetIfAbsentOrEqualResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfPresentAndHashEqual call', async () => {
      const testSetHash = await cacheClient.setWithHash(
        integrationTestCacheName,
        v4(),
        v4()
      );
      const hashValue =
        testSetHash instanceof CacheSetWithHash.Stored
          ? testSetHash.hashUint8Array()
          : new TextEncoder().encode(v4());
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.setIfPresentAndHashEqual(
          integrationTestCacheName,
          v4(),
          v4(),
          hashValue,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetIfPresentAndHashEqualResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfPresentAndHashNotEqual call', async () => {
      const testSetHash = await cacheClient.setWithHash(
        integrationTestCacheName,
        v4(),
        v4()
      );
      const hashValue =
        testSetHash instanceof CacheSetWithHash.Stored
          ? testSetHash.hashUint8Array()
          : new TextEncoder().encode(v4());
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.setIfPresentAndHashNotEqual(
          integrationTestCacheName,
          v4(),
          v4(),
          hashValue,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetIfPresentAndHashNotEqualResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfAbsentOrHashEqual call', async () => {
      const testSetHash = await cacheClient.setWithHash(
        integrationTestCacheName,
        v4(),
        v4()
      );
      const hashValue =
        testSetHash instanceof CacheSetWithHash.Stored
          ? testSetHash.hashUint8Array()
          : new TextEncoder().encode(v4());
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.setIfAbsentOrHashEqual(
          integrationTestCacheName,
          v4(),
          v4(),
          hashValue,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetIfAbsentOrHashEqualResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setIfAbsentOrHashNotEqual call', async () => {
      const testSetHash = await cacheClient.setWithHash(
        integrationTestCacheName,
        v4(),
        v4()
      );
      const hashValue =
        testSetHash instanceof CacheSetWithHash.Stored
          ? testSetHash.hashUint8Array()
          : new TextEncoder().encode(v4());
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.setIfAbsentOrHashNotEqual(
          integrationTestCacheName,
          v4(),
          v4(),
          hashValue,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSetIfAbsentOrHashNotEqualResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a delete call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const deleteResponse = await cacheClient.delete(
          integrationTestCacheName,
          v4(),
          {abortSignal}
        );
        if (
          deleteResponse.type === CacheDeleteResponse.Error &&
          deleteResponse.errorCode() === 'CANCELLED_ERROR' &&
          deleteResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a getBatch call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.getBatch(
          integrationTestCacheName,
          [v4()],
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheGetBatchResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a setBatch call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.setBatch(
          integrationTestCacheName,
          new Map<string, string>([
            ['a', 'apple'],
            ['b', 'berry'],
          ]),
          {abortSignal: abortSignal}
        );
        if (
          setResponse.type === CacheSetBatchResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listConcatenateBack call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.listConcatenateBack(
          integrationTestCacheName,
          v4(),
          [v4()],
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheListConcatenateBackResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listConcatenateFront call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.listConcatenateFront(
          integrationTestCacheName,
          v4(),
          [v4()],
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheListConcatenateFrontResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listFetch call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.listFetch(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheListFetchResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listRetain call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.listRetain(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheListRetainResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listLength call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.listLength(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheListLengthResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listPopBack call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.listPopBack(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheListPopBackResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listPopFront call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.listPopFront(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheListPopFrontResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listPushBack call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.listPushBack(
          integrationTestCacheName,
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheListPushBackResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listPushFront call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.listPushFront(
          integrationTestCacheName,
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheListPushFrontResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listRemoveValue call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.listRemoveValue(
          integrationTestCacheName,
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheListRemoveValueResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a dictionaryFetch call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.dictionaryFetch(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheDictionaryFetchResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a dictionarySetField call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.dictionarySetField(
          integrationTestCacheName,
          v4(),
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheDictionarySetFieldResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a dictionarySetFields call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.dictionarySetFields(
          integrationTestCacheName,
          v4(),
          new Map<string, string>([['a', 'b']]),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheDictionarySetFieldsResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a dictionaryGetField call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.dictionaryGetField(
          integrationTestCacheName,
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheDictionaryGetFieldResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a dictionaryGetFields call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.dictionaryGetFields(
          integrationTestCacheName,
          v4(),
          ['a', 'b'],
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheDictionaryGetFieldsResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a dictionaryRemoveField call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.dictionaryRemoveField(
          integrationTestCacheName,
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheDictionaryRemoveFieldResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a dictionaryRemoveFields call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.dictionaryRemoveFields(
          integrationTestCacheName,
          v4(),
          ['a', 'b'],
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheDictionaryRemoveFieldsResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a dictionaryLength call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.dictionaryLength(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheDictionaryLengthResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a increment call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.increment(
          integrationTestCacheName,
          v4(),
          5,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheIncrementResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a dictionaryIncrement call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.dictionaryIncrement(
          integrationTestCacheName,
          v4(),
          v4(),
          5,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheDictionaryIncrementResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetPutElement call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.sortedSetPutElement(
          integrationTestCacheName,
          v4(),
          v4(),
          50,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSortedSetPutElementResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetPutElements call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.sortedSetPutElements(
          integrationTestCacheName,
          v4(),
          [['val', 10]],
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSortedSetPutElementsResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetFetchByRank call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.sortedSetFetchByRank(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSortedSetFetchResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetFetchByScore call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.sortedSetFetchByScore(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSortedSetFetchResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetGetRank call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.sortedSetGetRank(
          integrationTestCacheName,
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSortedSetGetRankResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetGetScore call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.sortedSetGetScore(
          integrationTestCacheName,
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSortedSetGetScoreResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetGetScores call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.sortedSetGetScores(
          integrationTestCacheName,
          v4(),
          [v4()],
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSortedSetGetScoresResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetIncrementScore call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.sortedSetIncrementScore(
          integrationTestCacheName,
          v4(),
          v4(),
          5,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSortedSetIncrementScoreResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetRemoveElement call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.sortedSetRemoveElement(
          integrationTestCacheName,
          v4(),
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSortedSetRemoveElementResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetRemoveElements call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.sortedSetRemoveElements(
          integrationTestCacheName,
          v4(),
          [v4()],
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSortedSetRemoveElementsResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetLength call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.sortedSetLength(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSortedSetLengthResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetLengthByScore call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.sortedSetLengthByScore(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSortedSetLengthByScoreResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a sortedSetUnionStore call', async () => {
      const sourceSets: SortedSetSource[] = [
        {sortedSetName: 'set1', weight: 1},
        {sortedSetName: 'set2', weight: -1},
      ];
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.sortedSetUnionStore(
          integrationTestCacheName,
          v4(),
          sourceSets,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheSortedSetUnionStoreResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a itemGetType call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.itemGetType(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheItemGetTypeResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a itemGetTtl call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.itemGetTtl(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheItemGetTtlResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a keyExists call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.keyExists(
          integrationTestCacheName,
          v4(),
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheKeyExistsResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a updateTtl call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.updateTtl(
          integrationTestCacheName,
          v4(),
          100,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheUpdateTtlResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a keysExist call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.keysExist(
          integrationTestCacheName,
          [v4()],
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheKeysExistResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a increaseTtl call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.increaseTtl(
          integrationTestCacheName,
          v4(),
          50,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheIncreaseTtlResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a decreaseTtl call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.decreaseTtl(
          integrationTestCacheName,
          v4(),
          50,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CacheDecreaseTtlResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a createCache call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.createCache(
          integrationTestCacheName,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === CreateCacheResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a deleteCache call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.deleteCache(
          integrationTestCacheName,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === DeleteCacheResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a flushCache call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.flushCache(
          integrationTestCacheName,
          {
            abortSignal,
          }
        );
        if (
          setResponse.type === FlushCacheResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
    it('should cancel a listCaches call', async () => {
      const testGet = async () => {
        const abortSignal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.listCaches({
          abortSignal,
        });
        if (
          setResponse.type === ListCachesResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
  });
});
