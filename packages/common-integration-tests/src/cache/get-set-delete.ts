import {v4} from 'uuid';
import {
  CacheDelete,
  CacheGet,
  CacheGetWithHash,
  CacheIncrement,
  CacheItemGetTtl,
  CacheSet,
  CacheSetIfNotExists,
  CacheSetIfAbsent,
  CacheSetIfPresent,
  CacheSetIfEqual,
  CacheSetIfNotEqual,
  CacheSetIfPresentAndNotEqual,
  CacheSetIfAbsentOrEqual,
  MomentoErrorCode,
  FailedPreconditionError,
  CacheSetWithHash,
} from '@gomomento/sdk-core';
import {TextEncoder} from 'util';
import {
  ValidateCacheProps,
  ItBehavesLikeItValidatesCacheName,
  expectWithMessage,
} from '../common-int-test-utils';
import {sleep} from '@gomomento/sdk-core/dist/src/internal/utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/internal/clients/cache';

export function runGetSetDeleteTests(
  cacheClient: ICacheClient,
  cacheClientWithThrowOnErrors: ICacheClient,
  cacheClientWithBalancedReadConcern: ICacheClient,
  cacheClientWithConsistentReadConcern: ICacheClient,
  integrationTestCacheName: string
) {
  describe('get/set/delete', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return cacheClient.get(props.cacheName, v4());
    });
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return cacheClient.set(props.cacheName, v4(), v4());
    });
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return cacheClient.delete(props.cacheName, v4());
    });
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return cacheClient.getWithHash(props.cacheName, v4());
    });

    it('should set and get string from cache', async () => {
      const cacheKey = v4();
      const cacheValue = v4();

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
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });

    it('should set and get string hash and value from cache', async () => {
      const cacheKey = v4();
      const cacheValue = v4();

      const setResponse = await cacheClient.setWithHash(
        integrationTestCacheName,
        cacheKey,
        cacheValue
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
        expect(getResponse.valueString()).toEqual(cacheValue);
        expect(getResponse.hashString()).toEqual(setResponse.hashString());
      }
    });

    it('should set and get string with special characters from cache', async () => {
      const cacheKey = v4();
      const cacheValue = v4() + 'héllö wörld';

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
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });

    it('should setWithHash and getWithHash string with special characters from cache', async () => {
      const cacheKey = v4();
      const cacheValue = v4() + 'héllö wörld';

      const setResponse = await cacheClient.setWithHash(
        integrationTestCacheName,
        cacheKey,
        cacheValue
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
        expect(getResponse.valueString()).toEqual(cacheValue);
        expect(getResponse.hashString()).toEqual(setResponse.hashString());
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

    it('should set and get bytes with special characters from cache', async () => {
      const cacheKey = new TextEncoder().encode(v4());
      const cacheValue = new TextEncoder().encode(v4() + 'héllö wörld');
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

    it('should setWithHash and getWithHash bytes with special characters from cache', async () => {
      const cacheKey = new TextEncoder().encode(v4());
      const cacheValue = v4() + 'héllö wörld';

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
        expect(getResponse.valueString()).toEqual(cacheValue);
        expect(getResponse.hashString()).toEqual(setResponse.hashString());
      }
    });

    it('should set string key with bytes value', async () => {
      const cacheKey = v4();
      const cacheValue = new TextEncoder().encode(v4());
      const decodedValue = new TextDecoder().decode(cacheValue);
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
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(decodedValue);
      }
    });

    it('should setWithHash string key with bytes value', async () => {
      const cacheKey = v4();
      const cacheValue = new TextEncoder().encode(v4());
      const decodedValue = new TextDecoder().decode(cacheValue);

      const setResponse = await cacheClient.setWithHash(
        integrationTestCacheName,
        cacheKey,
        cacheValue
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
        expect(getResponse.valueString()).toEqual(decodedValue);
        expect(getResponse.hashString()).toEqual(setResponse.hashString());
      }
    });

    it('should set byte key with string value', async () => {
      const cacheValue = v4();
      const cacheKey = new TextEncoder().encode(v4());
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
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });

    it('should setWithHash byte key with string value', async () => {
      const cacheValue = v4();
      const cacheKey = new TextEncoder().encode(v4());

      const setResponse = await cacheClient.setWithHash(
        integrationTestCacheName,
        cacheKey,
        cacheValue
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
        expect(getResponse.valueString()).toEqual(cacheValue);
        expect(getResponse.hashString()).toEqual(setResponse.hashString());
      }
    });

    it('should set and get string from cache and returned set value matches string cacheValue', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
    });

    it('should set string key with bytes value and returned set value matches byte cacheValue', async () => {
      const cacheKey = v4();
      const cacheValue = new TextEncoder().encode(v4());
      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
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

    it('should setWithHash and then delete a value in cache', async () => {
      const cacheKey = v4();
      const cacheValue = new TextEncoder().encode(v4());
      await cacheClient.setWithHash(
        integrationTestCacheName,
        cacheKey,
        cacheValue
      );
      const getResponse = await cacheClient.getWithHash(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGetWithHash.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);

      const deleteResponse = await cacheClient.delete(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(deleteResponse).toBeInstanceOf(CacheDelete.Success);
      }, `expected SUCCESS but got ${deleteResponse.toString()}`);
      const getMiss = await cacheClient.getWithHash(
        integrationTestCacheName,
        cacheKey
      );
      expect(getMiss).toBeInstanceOf(CacheGetWithHash.Miss);
    });

    it('should return INVALID_ARGUMENT_ERROR for negative ttl when set with string key/value', async () => {
      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        v4(),
        v4(),
        {ttl: -1}
      );
      expect(setResponse).toBeInstanceOf(CacheSet.Error);
      if (setResponse instanceof CacheSet.Error) {
        expect(setResponse.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }
    });

    it('should return INVALID_ARGUMENT_ERROR for negative ttl when setWithHash with string key/value', async () => {
      const setResponse = await cacheClient.setWithHash(
        integrationTestCacheName,
        v4(),
        v4(),
        {ttl: -1}
      );
      expect(setResponse).toBeInstanceOf(CacheSetWithHash.Error);
      if (setResponse instanceof CacheSetWithHash.Error) {
        expect(setResponse.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }
    });

    it('should return INVALID_ARGUMENT_ERROR for float ttl when set with string key/value', async () => {
      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        v4(),
        v4(),
        {ttl: 1.5}
      );
      expect(setResponse).toBeInstanceOf(CacheSet.Error);
      if (setResponse instanceof CacheSet.Error) {
        expect(setResponse.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }
    });

    it('should return INVALID_ARGUMENT_ERROR for float ttl when setWithHash with string key/value', async () => {
      const setResponse = await cacheClient.setWithHash(
        integrationTestCacheName,
        v4(),
        v4(),
        {ttl: 1.5}
      );
      expect(setResponse).toBeInstanceOf(CacheSetWithHash.Error);
      if (setResponse instanceof CacheSetWithHash.Error) {
        expect(setResponse.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }
    });

    it('should set string key/value with valid ttl and get successfully', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        cacheValue,
        {ttl: 15}
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);

      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });

    it('should setWithHash string key/value with valid ttl and getWithHash successfully', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const setResponse = await cacheClient.setWithHash(
        integrationTestCacheName,
        cacheKey,
        cacheValue,
        {ttl: 15}
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetWithHash.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);

      const getResponse = await cacheClient.getWithHash(
        integrationTestCacheName,
        cacheKey
      );
      if (
        getResponse instanceof CacheGetWithHash.Hit &&
        setResponse instanceof CacheSetWithHash.Stored
      ) {
        expect(getResponse.valueString()).toEqual(cacheValue);
        expect(getResponse.hashString()).toEqual(setResponse.hashString());
      }
    });

    it('should set with valid ttl and should return miss when ttl is expired', async () => {
      const cacheKey = v4();
      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        v4(),
        {ttl: 1}
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      await sleep(3000);

      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Miss);
      }, `expected MISS but got ${getResponse.toString()}`);
    });

    it('should setWithHash with valid ttl and should return miss when ttl is expired', async () => {
      const cacheKey = v4();
      const setResponse = await cacheClient.setWithHash(
        integrationTestCacheName,
        cacheKey,
        v4(),
        {ttl: 1}
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetWithHash.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      await sleep(3000);

      const getResponse = await cacheClient.getWithHash(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGetWithHash.Miss);
      }, `expected MISS but got ${getResponse.toString()}`);
    });

    it('should support happy path for get, set, and delete via curried cache via ICache interface', async () => {
      const cacheKey = v4();
      const cacheValue = v4();

      const cache = cacheClient.cache(integrationTestCacheName);
      const setResponse = await cache.set(cacheKey, cacheValue);
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const getResponse = await cache.get(cacheKey);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }

      const deleteResponse = await cache.delete(cacheKey);
      expectWithMessage(() => {
        expect(deleteResponse).toBeInstanceOf(CacheDelete.Success);
      }, `expected SUCCESS but got ${deleteResponse.toString()}`);
      const getMiss = await cacheClient.get(integrationTestCacheName, cacheKey);
      expect(getMiss).toBeInstanceOf(CacheGet.Miss);
    });

    it('should support happy path for getWithHash, setWithHash, and delete via curried cache via ICache interface', async () => {
      const cacheKey = v4();
      const cacheValue = v4();

      const cache = cacheClient.cache(integrationTestCacheName);
      const setResponse = await cache.setWithHash(cacheKey, cacheValue);
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetWithHash.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const getResponse = await cache.getWithHash(cacheKey);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGetWithHash.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGetWithHash.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }

      const deleteResponse = await cache.delete(cacheKey);
      expectWithMessage(() => {
        expect(deleteResponse).toBeInstanceOf(CacheDelete.Success);
      }, `expected SUCCESS but got ${deleteResponse.toString()}`);
      const getMiss = await cacheClient.get(integrationTestCacheName, cacheKey);
      expect(getMiss).toBeInstanceOf(CacheGet.Miss);
    });

    it('should support accessing value for CacheGet.Hit without instanceof check', async () => {
      const cacheKey = v4();
      const cacheValue = v4();

      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      let getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);

      expect(getResponse.value()).toEqual(cacheValue);

      const hitResponse = getResponse as CacheGet.Hit;
      expect(hitResponse.value()).toEqual(cacheValue);
      expect(hitResponse.valueString()).toEqual(cacheValue);

      getResponse = await cacheClient.get(integrationTestCacheName, v4());
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Miss);
      }, `expected MISS but got ${getResponse.toString()}`);

      expect(getResponse.value()).toEqual(undefined);
    });
  });

  describe('#increment', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return cacheClient.increment(props.cacheName, v4(), 1);
    });

    it('increments from 0 to expected amount with string field', async () => {
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

    it('increments from 0 to expected amount with Uint8Array field', async () => {
      const field = new TextEncoder().encode(v4());
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

    it('increments with setting and resetting field', async () => {
      const field = v4();

      await cacheClient.set(integrationTestCacheName, field, '10');
      let response = await cacheClient.increment(
        integrationTestCacheName,
        field,
        0
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncrement.Success);
      }, `expected SUCCESS but got ${response.toString()}`);
      let successResponse = response as CacheIncrement.Success;
      expect(successResponse.valueNumber()).toEqual(10);

      response = await cacheClient.increment(
        integrationTestCacheName,
        field,
        90
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncrement.Success);
      }, `expected SUCCESS but got ${response.toString()}`);
      successResponse = response as CacheIncrement.Success;
      expect(successResponse.valueNumber()).toEqual(100);

      // Reset field
      await cacheClient.set(integrationTestCacheName, field, '0');
      response = await cacheClient.increment(
        integrationTestCacheName,
        field,
        0
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncrement.Success);
      }, `expected SUCCESS but got ${response.toString()}`);
      successResponse = response as CacheIncrement.Success;
      expect(successResponse.valueNumber()).toEqual(0);
    });

    it('fails with precondition with a bad amount', async () => {
      const field = v4();

      await cacheClient.set(integrationTestCacheName, field, 'abcxyz');
      const response = await cacheClient.increment(
        integrationTestCacheName,
        field,
        1
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncrement.Error);
      }, `expected ERROR but got ${response.toString()}`);
      const errorResponse = response as CacheIncrement.Error;
      expect(errorResponse.errorCode()).toEqual(
        MomentoErrorCode.FAILED_PRECONDITION_ERROR
      );
    });

    it('should support happy path for increment via curried cache via ICache interface', async () => {
      const field = v4();
      const cache = cacheClient.cache(integrationTestCacheName);

      await cache.set(field, '10');
      const response = await cache.increment(field, 42);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncrement.Success);
      }, `expected SUCCESS but got ${response.toString()}`);
      const successResponse = response as CacheIncrement.Success;
      expect(successResponse.valueNumber()).toEqual(52);
    });

    it('should support accessing value for CacheIncrement.Success without instanceof check', async () => {
      const field = v4();

      await cacheClient.set(integrationTestCacheName, field, '10');
      const response = await cacheClient.increment(
        integrationTestCacheName,
        field,
        42
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncrement.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      expect(response.value()).toEqual(52);

      const successResponse = response as CacheIncrement.Success;
      expect(successResponse.value()).toEqual(52);
      expect(successResponse.valueNumber()).toEqual(52);
    });

    it('fails with negative ttl', async () => {
      const field = v4();

      await cacheClient.set(integrationTestCacheName, field, '10');
      const response = await cacheClient.increment(
        integrationTestCacheName,
        field,
        10,
        {ttl: -1}
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncrement.Error);
      }, `expected ERROR but got ${response.toString()}`);
      const errorResponse = response as CacheIncrement.Error;
      expect(errorResponse.errorCode()).toEqual(
        MomentoErrorCode.INVALID_ARGUMENT_ERROR
      );
    });

    it('fails with float ttl', async () => {
      const field = v4();

      await cacheClient.set(integrationTestCacheName, field, '10');
      const response = await cacheClient.increment(
        integrationTestCacheName,
        field,
        10,
        {ttl: 1.5}
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncrement.Error);
      }, `expected ERROR but got ${response.toString()}`);
      const errorResponse = response as CacheIncrement.Error;
      expect(errorResponse.errorCode()).toEqual(
        MomentoErrorCode.INVALID_ARGUMENT_ERROR
      );
    });

    it('expires after ttl duration', async () => {
      const field = v4();
      await cacheClient.set(integrationTestCacheName, field, '10');
      const response = await cacheClient.increment(
        integrationTestCacheName,
        field,
        10,
        {ttl: 1}
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncrement.Success);
      }, `expected SUCCESS but got ${response.toString()}`);

      await sleep(3000);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        field
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Miss);
      }, `expected MISS but got ${getResponse.toString()}`);
    });
  });

  describe('#setIfNotExists', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return cacheClient.setIfNotExists(props.cacheName, v4(), v4());
    });

    it('should set and get string from cache', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const setResponse = await cacheClient.setIfNotExists(
        integrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
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

    it('should set and get remaining ttl from cache greater than expected', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const setResponse = await cacheClient.setIfNotExists(
        integrationTestCacheName,
        cacheKey,
        cacheValue,
        {ttl: 1000}
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const getTTLResponse = await cacheClient.itemGetTtl(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getTTLResponse).toBeInstanceOf(CacheItemGetTtl.Hit);
      }, `expected HIT but got ${getTTLResponse.toString()}`);
      if (getTTLResponse instanceof CacheItemGetTtl.Hit) {
        // we sent the ttl as 1000 seconds, so it's reasonable to expect the remaining TTL
        // will be greater than 950 seconds at least
        expect(getTTLResponse.remainingTtlMillis()).toBeGreaterThan(950 * 1000);
      }
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

    it('should not set and get string from cache when the key exists', async () => {
      const cacheKey = v4();
      const cacheValueOld = 'value1';
      const cacheValueNew = 'value2';
      const setResponse = await cacheClient.setIfNotExists(
        integrationTestCacheName,
        cacheKey,
        cacheValueOld
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const setIfNotExistsResponse = await cacheClient.setIfNotExists(
        integrationTestCacheName,
        cacheKey,
        cacheValueNew
      );
      expectWithMessage(() => {
        expect(setIfNotExistsResponse).toBeInstanceOf(
          CacheSetIfNotExists.NotStored
        );
      }, `expected NOTSTORED but got ${setIfNotExistsResponse.toString()}`);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValueOld);
      }
    });

    it('should set and get bytes from cache', async () => {
      const cacheKey = new TextEncoder().encode(v4());
      const cacheValue = new TextEncoder().encode(v4());
      const setResponse = await cacheClient.setIfNotExists(
        integrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
    });

    it('should set string key with bytes value', async () => {
      const cacheKey = v4();
      const cacheValue = new TextEncoder().encode(v4());
      const decodedValue = new TextDecoder().decode(cacheValue);
      const setResponse = await cacheClient.setIfNotExists(
        integrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(decodedValue);
      }
    });

    it('should set byte key with string value', async () => {
      const cacheValue = v4();
      const cacheKey = new TextEncoder().encode(v4());
      const setResponse = await cacheClient.setIfNotExists(
        integrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
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

    it('should set and get string from cache and returned set value matches string cacheValue', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const setResponse = await cacheClient.setIfNotExists(
        integrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
    });

    it('should set string key with bytes value and returned set value matches byte cacheValue', async () => {
      const cacheKey = v4();
      const cacheValue = new TextEncoder().encode(v4());
      const setResponse = await cacheClient.setIfNotExists(
        integrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
    });

    it('should return INVALID_ARGUMENT_ERROR for invalid ttl when set with string key/value', async () => {
      const setResponse = await cacheClient.setIfNotExists(
        integrationTestCacheName,
        v4(),
        v4(),
        {ttl: -1}
      );
      expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Error);
      if (setResponse instanceof CacheSetIfNotExists.Error) {
        expect(setResponse.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }
    });

    it('should set string key/value with valid ttl and get successfully', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const setResponse = await cacheClient.setIfNotExists(
        integrationTestCacheName,
        cacheKey,
        cacheValue,
        {ttl: 15}
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);

      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });

    it('should set with valid ttl and should return miss when ttl is expired', async () => {
      const cacheKey = v4();
      const setResponse = await cacheClient.setIfNotExists(
        integrationTestCacheName,
        cacheKey,
        v4(),
        {ttl: 1}
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      await sleep(3000);

      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Miss);
      }, `expected MISS but got ${getResponse.toString()}`);
    });

    it('should support happy path for setIfNotExists via curried cache via ICache interface', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const cache = cacheClient.cache(integrationTestCacheName);

      const setResponse = await cache.setIfNotExists(cacheKey, cacheValue);
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const getResponse = await cache.get(cacheKey);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });
  });

  describe('#setIfAbsent', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return cacheClient.setIfAbsent(props.cacheName, v4(), v4());
    });

    it('should set and get string from cache', async () => {
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

    it('should set and get remaining ttl from cache greater than expected', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const setResponse = await cacheClient.setIfAbsent(
        integrationTestCacheName,
        cacheKey,
        cacheValue,
        {ttl: 1000}
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfAbsent.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const getTTLResponse = await cacheClient.itemGetTtl(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getTTLResponse).toBeInstanceOf(CacheItemGetTtl.Hit);
      }, `expected HIT but got ${getTTLResponse.toString()}`);
      if (getTTLResponse instanceof CacheItemGetTtl.Hit) {
        // we sent the ttl as 1000 seconds, so it's reasonable to expect the remaining TTL
        // will be greater than 950 seconds at least
        expect(getTTLResponse.remainingTtlMillis()).toBeGreaterThan(950 * 1000);
      }
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

    it('should not set and get string from cache when the key exists', async () => {
      const cacheKey = v4();
      const cacheValueOld = 'value1';
      const cacheValueNew = 'value2';
      const setResponse = await cacheClient.setIfAbsent(
        integrationTestCacheName,
        cacheKey,
        cacheValueOld
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfAbsent.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const setIfAbsentResponse = await cacheClient.setIfAbsent(
        integrationTestCacheName,
        cacheKey,
        cacheValueNew
      );
      expectWithMessage(() => {
        expect(setIfAbsentResponse).toBeInstanceOf(CacheSetIfAbsent.NotStored);
      }, `expected NOTSTORED but got ${setIfAbsentResponse.toString()}`);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValueOld);
      }
    });

    it('should set and get bytes from cache', async () => {
      const cacheKey = new TextEncoder().encode(v4());
      const cacheValue = new TextEncoder().encode(v4());
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
    });

    it('should set string key with bytes value', async () => {
      const cacheKey = v4();
      const cacheValue = new TextEncoder().encode(v4());
      const decodedValue = new TextDecoder().decode(cacheValue);
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
        expect(getResponse.valueString()).toEqual(decodedValue);
      }
    });

    it('should set byte key with string value', async () => {
      const cacheValue = v4();
      const cacheKey = new TextEncoder().encode(v4());
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

    it('should return INVALID_ARGUMENT_ERROR for invalid ttl when set with string key/value', async () => {
      const setResponse = await cacheClient.setIfAbsent(
        integrationTestCacheName,
        v4(),
        v4(),
        {ttl: -1}
      );
      expect(setResponse).toBeInstanceOf(CacheSetIfAbsent.Error);
      if (setResponse instanceof CacheSetIfAbsent.Error) {
        expect(setResponse.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }
    });

    it('should set string key/value with valid ttl and get successfully', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const setResponse = await cacheClient.setIfAbsent(
        integrationTestCacheName,
        cacheKey,
        cacheValue,
        {ttl: 15}
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfAbsent.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);

      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });

    it('should set with valid ttl and should return miss when ttl is expired', async () => {
      const cacheKey = v4();
      const setResponse = await cacheClient.setIfAbsent(
        integrationTestCacheName,
        cacheKey,
        v4(),
        {ttl: 1}
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfAbsent.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      await sleep(3000);

      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Miss);
      }, `expected MISS but got ${getResponse.toString()}`);
    });

    it('should support happy path for setIfAbsent via curried cache via ICache interface', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const cache = cacheClient.cache(integrationTestCacheName);

      const setResponse = await cache.setIfAbsent(cacheKey, cacheValue);
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfAbsent.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const getResponse = await cache.get(cacheKey);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });
  });

  describe('#setIfPresent', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return cacheClient.setIfPresent(props.cacheName, v4(), v4());
    });

    it('should set string key if key is present', async () => {
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

    it('should set and get remaining ttl from cache greater than expected', async () => {
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
        cacheValue,
        {ttl: 1000}
      );
      expectWithMessage(() => {
        expect(setIfPresentResponse).toBeInstanceOf(CacheSetIfPresent.Stored);
      }, `expected STORED but got ${setIfPresentResponse.toString()}`);
      const getTTLResponse = await cacheClient.itemGetTtl(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getTTLResponse).toBeInstanceOf(CacheItemGetTtl.Hit);
      }, `expected HIT but got ${getTTLResponse.toString()}`);
      if (getTTLResponse instanceof CacheItemGetTtl.Hit) {
        // we sent the ttl as 1000 seconds, so it's reasonable to expect the remaining TTL
        // will be greater than 950 seconds at least
        expect(getTTLResponse.remainingTtlMillis()).toBeGreaterThan(950 * 1000);
      }
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

    it('should set string from cache when the key exists', async () => {
      const cacheKey = v4();
      const cacheValueOld = 'value1';
      const cacheValueNew = 'value2';
      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        cacheValueOld
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const setIfPresentResponse = await cacheClient.setIfPresent(
        integrationTestCacheName,
        cacheKey,
        cacheValueNew
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
        expect(getResponse.valueString()).toEqual(cacheValueNew);
      }
    });

    it('should not set string when the key does not exist', async () => {
      const cacheKey = v4();
      const cacheValue = 'value1';
      const setResponse = await cacheClient.setIfPresent(
        integrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfPresent.NotStored);
      }, `expected NOTSTORED but got ${setResponse.toString()}`);
    });

    it('should set and get bytes', async () => {
      const cacheKey = new TextEncoder().encode(v4());
      const cacheValue = new TextEncoder().encode(v4());
      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        v4()
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
      expectWithMessage(() => {
        expect(new TextEncoder().encode(getResponse.value())).toEqual(
          cacheValue
        );
      }, `expected ${cacheValue.toString()} but got ${getResponse.value() || 'undefined'}`);
    });

    it('should set string key with bytes value', async () => {
      const cacheKey = v4();
      const cacheValue = new TextEncoder().encode(v4());
      const decodedValue = new TextDecoder().decode(cacheValue);
      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        v4()
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
        expect(getResponse.valueString()).toEqual(decodedValue);
      }
    });

    it('should set byte key with string value', async () => {
      const cacheValue = v4();
      const cacheKey = new TextEncoder().encode(v4());
      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        v4()
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

    it('should return INVALID_ARGUMENT_ERROR for invalid ttl when set with string key/value', async () => {
      const setResponse = await cacheClient.setIfPresent(
        integrationTestCacheName,
        v4(),
        v4(),
        {ttl: -1}
      );
      expect(setResponse).toBeInstanceOf(CacheSetIfPresent.Error);
      if (setResponse instanceof CacheSetIfPresent.Error) {
        expect(setResponse.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }
    });

    it('should set string key/value with valid ttl and get successfully', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        v4()
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const setIfPresentResponse = await cacheClient.setIfPresent(
        integrationTestCacheName,
        cacheKey,
        cacheValue,
        {ttl: 15}
      );
      expectWithMessage(() => {
        expect(setIfPresentResponse).toBeInstanceOf(CacheSetIfPresent.Stored);
      }, `expected STORED but got ${setIfPresentResponse.toString()}`);

      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });

    it('should set with valid ttl and should return miss when ttl is expired', async () => {
      const cacheKey = v4();
      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        v4(),
        {ttl: 100}
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const setIfPresentResponse = await cacheClient.setIfPresent(
        integrationTestCacheName,
        cacheKey,
        v4(),
        {ttl: 1}
      );
      expectWithMessage(() => {
        expect(setIfPresentResponse).toBeInstanceOf(CacheSetIfPresent.Stored);
      }, `expected STORED but got ${setIfPresentResponse.toString()}`);
      await sleep(1500);

      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Miss);
      }, `expected MISS but got ${getResponse.toString()}`);
    });

    it('should support happy path for setIfPresent via curried cache via ICache interface', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const cache = cacheClient.cache(integrationTestCacheName);
      const setResponse = await cache.set(cacheKey, v4());
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const setIfPresentResponse = await cache.setIfPresent(
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setIfPresentResponse).toBeInstanceOf(CacheSetIfPresent.Stored);
      }, `expected STORED but got ${setIfPresentResponse.toString()}`);
      const getResponse = await cache.get(cacheKey);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });
  });

  describe('#setIfEqual', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return cacheClient.setIfEqual(props.cacheName, v4(), v4(), v4());
    });

    it('should set cache key if value to check is equal', async () => {
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

    it('should get remaining ttl from cache greater than expected', async () => {
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
        initialCacheValue,
        {ttl: 1000}
      );
      expectWithMessage(() => {
        expect(setIfEqualResponse).toBeInstanceOf(CacheSetIfEqual.Stored);
      }, `expected STORED but got ${setIfEqualResponse.toString()}`);
      const getTTLResponse = await cacheClient.itemGetTtl(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getTTLResponse).toBeInstanceOf(CacheItemGetTtl.Hit);
      }, `expected HIT but got ${getTTLResponse.toString()}`);
      if (getTTLResponse instanceof CacheItemGetTtl.Hit) {
        // we sent the ttl as 1000 seconds, so it's reasonable to expect the remaining TTL
        // will be greater than 950 seconds at least
        expect(getTTLResponse.remainingTtlMillis()).toBeGreaterThan(950 * 1000);
      }
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

    it('should not set string when the current value is not equal to value to check', async () => {
      const cacheKey = v4();
      const initialCacheValue = v4();
      const cacheValue = v4();
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
        v4()
      );
      expectWithMessage(() => {
        expect(setIfEqualResponse).toBeInstanceOf(CacheSetIfEqual.NotStored);
      }, `expected NOTSTORED but got ${setIfEqualResponse.toString()}`);
    });

    it('should set and get bytes', async () => {
      const cacheKey = new TextEncoder().encode(v4());
      const cacheValue = new TextEncoder().encode(v4());
      const initialCacheValue = new TextEncoder().encode(v4());
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
      expectWithMessage(() => {
        expect(new TextEncoder().encode(getResponse.value())).toEqual(
          cacheValue
        );
      }, `expected ${cacheValue.toString()} but got ${getResponse.value() || 'undefined'}`);
    });

    it('should set string key with bytes value', async () => {
      const cacheKey = v4();
      const cacheValue = new TextEncoder().encode(v4());
      const decodedValue = new TextDecoder().decode(cacheValue);
      const initialCacheValue = new TextEncoder().encode(v4());
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
        expect(getResponse.valueString()).toEqual(decodedValue);
      }
    });

    it('should set byte key with string value', async () => {
      const cacheValue = v4();
      const initialCacheValue = v4();
      const cacheKey = new TextEncoder().encode(v4());
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

    it('should return INVALID_ARGUMENT_ERROR for invalid ttl when set with string key/value', async () => {
      const setResponse = await cacheClient.setIfEqual(
        integrationTestCacheName,
        v4(),
        v4(),
        v4(),
        {ttl: -1}
      );
      expect(setResponse).toBeInstanceOf(CacheSetIfEqual.Error);
      if (setResponse instanceof CacheSetIfEqual.Error) {
        expect(setResponse.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }
    });

    it('should set string key/value with valid ttl and get successfully', async () => {
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
        initialCacheValue,
        {ttl: 15}
      );
      expectWithMessage(() => {
        expect(setIfEqualResponse).toBeInstanceOf(CacheSetIfEqual.Stored);
      }, `expected STORED but got ${setIfEqualResponse.toString()}`);

      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });

    it('should set with valid ttl and should return miss when ttl is expired', async () => {
      const cacheKey = v4();
      const initalCacheValue = v4();
      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        initalCacheValue,
        {ttl: 100}
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const setIfEqualResponse = await cacheClient.setIfEqual(
        integrationTestCacheName,
        cacheKey,
        v4(),
        initalCacheValue,
        {ttl: 1}
      );
      expectWithMessage(() => {
        expect(setIfEqualResponse).toBeInstanceOf(CacheSetIfEqual.Stored);
      }, `expected STORED but got ${setIfEqualResponse.toString()}`);
      await sleep(1500);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Miss);
      }, `expected MISS but got ${getResponse.toString()}`);
    });

    it('should support happy path for setIfEqual via curried cache via ICache interface', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const initialCacheValue = v4();
      const cache = cacheClient.cache(integrationTestCacheName);
      const setResponse = await cache.set(cacheKey, initialCacheValue);
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const setIfEqualResponse = await cache.setIfEqual(
        cacheKey,
        cacheValue,
        initialCacheValue
      );
      expectWithMessage(() => {
        expect(setIfEqualResponse).toBeInstanceOf(CacheSetIfEqual.Stored);
      }, `expected STORED but got ${setIfEqualResponse.toString()}`);
      const getResponse = await cache.get(cacheKey);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });
  });

  describe('#setIfNotEqual', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return cacheClient.setIfNotEqual(props.cacheName, v4(), v4(), v4());
    });

    it('should not set cache key if value to check is equal', async () => {
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

    it('should get remaining ttl from cache greater than expected', async () => {
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
        v4(),
        {ttl: 1000}
      );
      expectWithMessage(() => {
        expect(setIfNotEqualResponse).toBeInstanceOf(CacheSetIfNotEqual.Stored);
      }, `expected STORED but got ${setIfNotEqualResponse.toString()}`);
      const getTTLResponse = await cacheClient.itemGetTtl(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getTTLResponse).toBeInstanceOf(CacheItemGetTtl.Hit);
      }, `expected HIT but got ${getTTLResponse.toString()}`);
      if (getTTLResponse instanceof CacheItemGetTtl.Hit) {
        // we sent the ttl as 1000 seconds, so it's reasonable to expect the remaining TTL
        // will be greater than 950 seconds at least
        expect(getTTLResponse.remainingTtlMillis()).toBeGreaterThan(950 * 1000);
      }
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

    it('should not set string when the current value is equal to value to check', async () => {
      const cacheKey = v4();
      const initialCacheValue = v4();
      const cacheValue = v4();
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
    });

    it('should set and get bytes', async () => {
      const cacheKey = new TextEncoder().encode(v4());
      const cacheValue = new TextEncoder().encode(v4());
      const initialCacheValue = new TextEncoder().encode(v4());
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
        v4()
      );
      expectWithMessage(() => {
        expect(setIfNotEqualResponse).toBeInstanceOf(CacheSetIfNotEqual.Stored);
      }, `expected STORED but got ${setIfNotEqualResponse.toString()}`);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      expectWithMessage(() => {
        expect(new TextEncoder().encode(getResponse.value())).toEqual(
          cacheValue
        );
      }, `expected ${cacheValue.toString()} but got ${getResponse.value() || 'undefined'}`);
    });

    it('should set string key with bytes value', async () => {
      const cacheKey = v4();
      const cacheValue = new TextEncoder().encode(v4());
      const decodedValue = new TextDecoder().decode(cacheValue);
      const initialCacheValue = new TextEncoder().encode(v4());
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
        v4()
      );
      expectWithMessage(() => {
        expect(setIfNotEqualResponse).toBeInstanceOf(CacheSetIfNotEqual.Stored);
      }, `expected STORED but got ${setIfNotEqualResponse.toString()}`);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(decodedValue);
      }
    });

    it('should set byte key with string value', async () => {
      const cacheValue = v4();
      const initialCacheValue = v4();
      const cacheKey = new TextEncoder().encode(v4());
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
        v4()
      );
      expectWithMessage(() => {
        expect(setIfNotEqualResponse).toBeInstanceOf(CacheSetIfNotEqual.Stored);
      }, `expected STORED but got ${setIfNotEqualResponse.toString()}`);
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

    it('should return INVALID_ARGUMENT_ERROR for invalid ttl when set with string key/value', async () => {
      const setResponse = await cacheClient.setIfNotEqual(
        integrationTestCacheName,
        v4(),
        v4(),
        v4(),
        {ttl: -1}
      );
      expect(setResponse).toBeInstanceOf(CacheSetIfNotEqual.Error);
      if (setResponse instanceof CacheSetIfNotEqual.Error) {
        expect(setResponse.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }
    });

    it('should set string key/value with valid ttl and get successfully', async () => {
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
        v4(),
        {ttl: 15}
      );
      expectWithMessage(() => {
        expect(setIfNotEqualResponse).toBeInstanceOf(CacheSetIfNotEqual.Stored);
      }, `expected STORED but got ${setIfNotEqualResponse.toString()}`);

      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });

    it('should set with valid ttl and should return miss when ttl is expired', async () => {
      const cacheKey = v4();
      const initalCacheValue = v4();
      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        initalCacheValue,
        {ttl: 100}
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const setIfNotEqualResponse = await cacheClient.setIfNotEqual(
        integrationTestCacheName,
        cacheKey,
        v4(),
        v4(),
        {ttl: 1}
      );
      expectWithMessage(() => {
        expect(setIfNotEqualResponse).toBeInstanceOf(CacheSetIfNotEqual.Stored);
      }, `expected STORED but got ${setIfNotEqualResponse.toString()}`);
      await sleep(1500);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Miss);
      }, `expected MISS but got ${getResponse.toString()}`);
    });

    it('should support happy path for setIfNotEqual via curried cache via ICache interface', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const initialCacheValue = v4();
      const cache = cacheClient.cache(integrationTestCacheName);
      const setResponse = await cache.set(cacheKey, initialCacheValue);
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const setIfNotEqualResponse = await cache.setIfNotEqual(
        cacheKey,
        cacheValue,
        v4()
      );
      expectWithMessage(() => {
        expect(setIfNotEqualResponse).toBeInstanceOf(CacheSetIfNotEqual.Stored);
      }, `expected STORED but got ${setIfNotEqualResponse.toString()}`);
      const getResponse = await cache.get(cacheKey);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });
  });

  describe('#setIfPresentAndNotEqual', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return cacheClient.setIfPresentAndNotEqual(
        props.cacheName,
        v4(),
        v4(),
        v4()
      );
    });

    it('should set cache key if key is present and value to check is not equal', async () => {
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

    it('should not set cache key if key is present and value to check is equal', async () => {
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
          initialCacheValue
        );
      expectWithMessage(() => {
        expect(setIfPresentAndNotEqualResponse).toBeInstanceOf(
          CacheSetIfPresentAndNotEqual.NotStored
        );
      }, `expected NOTSTORED but got ${setIfPresentAndNotEqualResponse.toString()}`);
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

    it('should not set cache key if key is not present', async () => {
      const cacheKey = v4();

      const setIfPresentAndNotEqualResponse =
        await cacheClient.setIfPresentAndNotEqual(
          integrationTestCacheName,
          cacheKey,
          v4(),
          v4()
        );
      expectWithMessage(() => {
        expect(setIfPresentAndNotEqualResponse).toBeInstanceOf(
          CacheSetIfPresentAndNotEqual.NotStored
        );
      }, `expected NOTSTORED but got ${setIfPresentAndNotEqualResponse.toString()}`);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Miss);
      }, `expected MISS but got ${getResponse.toString()}`);
    });

    it('should get remaining ttl from cache greater than expected', async () => {
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
          v4(),
          {ttl: 1000}
        );
      expectWithMessage(() => {
        expect(setIfPresentAndNotEqualResponse).toBeInstanceOf(
          CacheSetIfPresentAndNotEqual.Stored
        );
      }, `expected STORED but got ${setIfPresentAndNotEqualResponse.toString()}`);
      const getTTLResponse = await cacheClient.itemGetTtl(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getTTLResponse).toBeInstanceOf(CacheItemGetTtl.Hit);
      }, `expected HIT but got ${getTTLResponse.toString()}`);
      if (getTTLResponse instanceof CacheItemGetTtl.Hit) {
        // we sent the ttl as 1000 seconds, so it's reasonable to expect the remaining TTL
        // will be greater than 950 seconds at least
        expect(getTTLResponse.remainingTtlMillis()).toBeGreaterThan(950 * 1000);
      }
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

    it('should not set string when the key is present and current value is equal to value to check', async () => {
      const cacheKey = v4();
      const initialCacheValue = v4();
      const cacheValue = v4();
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
          initialCacheValue
        );
      expectWithMessage(() => {
        expect(setIfPresentAndNotEqualResponse).toBeInstanceOf(
          CacheSetIfPresentAndNotEqual.NotStored
        );
      }, `expected NOTSTORED but got ${setIfPresentAndNotEqualResponse.toString()}`);
    });

    it('should set and get bytes', async () => {
      const cacheKey = new TextEncoder().encode(v4());
      const cacheValue = new TextEncoder().encode(v4());
      const initialCacheValue = new TextEncoder().encode(v4());
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
      expectWithMessage(() => {
        expect(new TextEncoder().encode(getResponse.value())).toEqual(
          cacheValue
        );
      }, `expected ${cacheValue.toString()} but got ${getResponse.value() || 'undefined'}`);
    });

    it('should set string key with bytes value', async () => {
      const cacheKey = v4();
      const cacheValue = new TextEncoder().encode(v4());
      const decodedValue = new TextDecoder().decode(cacheValue);
      const initialCacheValue = new TextEncoder().encode(v4());
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
        expect(getResponse.valueString()).toEqual(decodedValue);
      }
    });

    it('should set byte key with string value', async () => {
      const cacheValue = v4();
      const initialCacheValue = v4();
      const cacheKey = new TextEncoder().encode(v4());
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

    it('should return INVALID_ARGUMENT_ERROR for invalid ttl when set with string key/value', async () => {
      const setResponse = await cacheClient.setIfPresentAndNotEqual(
        integrationTestCacheName,
        v4(),
        v4(),
        v4(),
        {ttl: -1}
      );
      expect(setResponse).toBeInstanceOf(CacheSetIfPresentAndNotEqual.Error);
      if (setResponse instanceof CacheSetIfPresentAndNotEqual.Error) {
        expect(setResponse.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }
    });

    it('should set string key/value with valid ttl and get successfully', async () => {
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
          v4(),
          {ttl: 15}
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
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });

    it('should set with valid ttl and should return miss when ttl is expired', async () => {
      const cacheKey = v4();
      const initalCacheValue = v4();
      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        cacheKey,
        initalCacheValue,
        {ttl: 100}
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const setIfPresentAndNotEqualResponse =
        await cacheClient.setIfPresentAndNotEqual(
          integrationTestCacheName,
          cacheKey,
          v4(),
          v4(),
          {ttl: 1}
        );
      expectWithMessage(() => {
        expect(setIfPresentAndNotEqualResponse).toBeInstanceOf(
          CacheSetIfPresentAndNotEqual.Stored
        );
      }, `expected STORED but got ${setIfPresentAndNotEqualResponse.toString()}`);
      await sleep(1500);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Miss);
      }, `expected MISS but got ${getResponse.toString()}`);
    });

    it('should support happy path for setIfPresentAndNotEqual via curried cache via ICache interface', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const initialCacheValue = v4();
      const cache = cacheClient.cache(integrationTestCacheName);
      const setResponse = await cache.set(cacheKey, initialCacheValue);
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const setIfPresentAndNotEqualResponse =
        await cache.setIfPresentAndNotEqual(cacheKey, cacheValue, v4());
      expectWithMessage(() => {
        expect(setIfPresentAndNotEqualResponse).toBeInstanceOf(
          CacheSetIfPresentAndNotEqual.Stored
        );
      }, `expected STORED but got ${setIfPresentAndNotEqualResponse.toString()}`);
      const getResponse = await cache.get(cacheKey);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });
  });

  describe('#setIfAbsentOrEqual', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return cacheClient.setIfAbsentOrEqual(props.cacheName, v4(), v4(), v4());
    });

    it('should not set cache key if key is present and value to check is not equal to cached value', async () => {
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

    it('should set cache key if key is present and value to check is equal', async () => {
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
        initialCacheValue
      );
      expectWithMessage(() => {
        expect(setIfAbsentOrEqualResponse).toBeInstanceOf(
          CacheSetIfAbsentOrEqual.Stored
        );
      }, `expected STORED but got ${setIfAbsentOrEqualResponse.toString()}`);
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

    it('should set cache key if key is not present', async () => {
      const cacheKey = v4();
      const cacheValue = v4();

      const setIfAbsentOrEqualResponse = await cacheClient.setIfAbsentOrEqual(
        integrationTestCacheName,
        cacheKey,
        cacheValue,
        v4()
      );
      expectWithMessage(() => {
        expect(setIfAbsentOrEqualResponse).toBeInstanceOf(
          CacheSetIfAbsentOrEqual.Stored
        );
      }, `expected STORED but got ${setIfAbsentOrEqualResponse.toString()}`);
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

    it('should get remaining ttl from cache greater than expected', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const setIfAbsentOrEqualResponse = await cacheClient.setIfAbsentOrEqual(
        integrationTestCacheName,
        cacheKey,
        cacheValue,
        v4(),
        {ttl: 1000}
      );
      expectWithMessage(() => {
        expect(setIfAbsentOrEqualResponse).toBeInstanceOf(
          CacheSetIfAbsentOrEqual.Stored
        );
      }, `expected STORED but got ${setIfAbsentOrEqualResponse.toString()}`);
      const getTTLResponse = await cacheClient.itemGetTtl(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getTTLResponse).toBeInstanceOf(CacheItemGetTtl.Hit);
      }, `expected HIT but got ${getTTLResponse.toString()}`);
      if (getTTLResponse instanceof CacheItemGetTtl.Hit) {
        // we sent the ttl as 1000 seconds, so it's reasonable to expect the remaining TTL
        // will be greater than 950 seconds at least
        expect(getTTLResponse.remainingTtlMillis()).toBeGreaterThan(950 * 1000);
      }
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

    it('should set and get bytes', async () => {
      const cacheKey = new TextEncoder().encode(v4());
      const cacheValue = new TextEncoder().encode(v4());
      const setIfAbsentOrEqualResponse = await cacheClient.setIfAbsentOrEqual(
        integrationTestCacheName,
        cacheKey,
        cacheValue,
        v4()
      );
      expectWithMessage(() => {
        expect(setIfAbsentOrEqualResponse).toBeInstanceOf(
          CacheSetIfAbsentOrEqual.Stored
        );
      }, `expected STORED but got ${setIfAbsentOrEqualResponse.toString()}`);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      expectWithMessage(() => {
        expect(new TextEncoder().encode(getResponse.value())).toEqual(
          cacheValue
        );
      }, `expected ${cacheValue.toString()} but got ${getResponse.value() || 'undefined'}`);
    });

    it('should set string key with bytes value', async () => {
      const cacheKey = v4();
      const cacheValue = new TextEncoder().encode(v4());
      const decodedValue = new TextDecoder().decode(cacheValue);
      const setIfAbsentOrEqualResponse = await cacheClient.setIfAbsentOrEqual(
        integrationTestCacheName,
        cacheKey,
        cacheValue,
        v4()
      );
      expectWithMessage(() => {
        expect(setIfAbsentOrEqualResponse).toBeInstanceOf(
          CacheSetIfAbsentOrEqual.Stored
        );
      }, `expected STORED but got ${setIfAbsentOrEqualResponse.toString()}`);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(decodedValue);
      }
    });

    it('should set byte key with string value', async () => {
      const cacheValue = v4();
      const cacheKey = new TextEncoder().encode(v4());
      const setIfAbsentOrEqualResponse = await cacheClient.setIfAbsentOrEqual(
        integrationTestCacheName,
        cacheKey,
        cacheValue,
        v4()
      );
      expectWithMessage(() => {
        expect(setIfAbsentOrEqualResponse).toBeInstanceOf(
          CacheSetIfAbsentOrEqual.Stored
        );
      }, `expected STORED but got ${setIfAbsentOrEqualResponse.toString()}`);
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

    it('should return INVALID_ARGUMENT_ERROR for invalid ttl when set with string key/value', async () => {
      const setResponse = await cacheClient.setIfAbsentOrEqual(
        integrationTestCacheName,
        v4(),
        v4(),
        v4(),
        {ttl: -1}
      );
      expect(setResponse).toBeInstanceOf(CacheSetIfAbsentOrEqual.Error);
      if (setResponse instanceof CacheSetIfAbsentOrEqual.Error) {
        expect(setResponse.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
        );
      }
    });

    it('should set string key/value with valid ttl and get successfully', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const setIfAbsentOrEqualResponse = await cacheClient.setIfAbsentOrEqual(
        integrationTestCacheName,
        cacheKey,
        cacheValue,
        v4(),
        {ttl: 15}
      );
      expectWithMessage(() => {
        expect(setIfAbsentOrEqualResponse).toBeInstanceOf(
          CacheSetIfAbsentOrEqual.Stored
        );
      }, `expected STORED but got ${setIfAbsentOrEqualResponse.toString()}`);

      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });

    it('should set with valid ttl and should return miss when ttl is expired', async () => {
      const cacheKey = v4();
      const setIfAbsentOrEqualResponse = await cacheClient.setIfAbsentOrEqual(
        integrationTestCacheName,
        cacheKey,
        v4(),
        v4(),
        {ttl: 1}
      );
      expectWithMessage(() => {
        expect(setIfAbsentOrEqualResponse).toBeInstanceOf(
          CacheSetIfAbsentOrEqual.Stored
        );
      }, `expected STORED but got ${setIfAbsentOrEqualResponse.toString()}`);
      await sleep(1500);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Miss);
      }, `expected MISS but got ${getResponse.toString()}`);
    });

    it('should support happy path for setIfAbsentOrEqual via curried cache via ICache interface', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const cache = cacheClient.cache(integrationTestCacheName);
      const setIfAbsentOrEqualResponse = await cache.setIfAbsentOrEqual(
        cacheKey,
        cacheValue,
        v4()
      );
      expectWithMessage(() => {
        expect(setIfAbsentOrEqualResponse).toBeInstanceOf(
          CacheSetIfAbsentOrEqual.Stored
        );
      }, `expected STORED but got ${setIfAbsentOrEqualResponse.toString()}`);
      const getResponse = await cache.get(cacheKey);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });
  });

  describe('when configured to throw on errors', () => {
    it('throws a FailedPreconditionError if increment is called on a string', async () => {
      const field = v4();

      const setResponse = await cacheClientWithThrowOnErrors.set(
        integrationTestCacheName,
        field,
        'abcxyz'
      );
      expect(setResponse).toBeInstanceOf(CacheSet.Success);

      await expect(async () => {
        await cacheClientWithThrowOnErrors.increment(
          integrationTestCacheName,
          field,
          1
        );
      }).rejects.toBeInstanceOf(FailedPreconditionError);
    });
  });

  describe('when ReadConcern is specified', () => {
    it('gets, sets, and deletes with Balanced ReadConcern', async () => {
      const cacheKey = v4();
      const cacheValue = new TextEncoder().encode(v4());
      await cacheClientWithBalancedReadConcern.set(
        integrationTestCacheName,
        cacheKey,
        cacheValue
      );
      const getResponse = await cacheClientWithBalancedReadConcern.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);

      const deleteResponse = await cacheClientWithBalancedReadConcern.delete(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(deleteResponse).toBeInstanceOf(CacheDelete.Success);
      }, `expected SUCCESS but got ${deleteResponse.toString()}`);
      const getMiss = await cacheClientWithBalancedReadConcern.get(
        integrationTestCacheName,
        cacheKey
      );
      expect(getMiss).toBeInstanceOf(CacheGet.Miss);
    });

    it('gets, sets, and deletes with Consistent ReadConcern', async () => {
      const cacheKey = v4();
      const cacheValue = new TextEncoder().encode(v4());
      await cacheClientWithConsistentReadConcern.set(
        integrationTestCacheName,
        cacheKey,
        cacheValue
      );
      const getResponse = await cacheClientWithConsistentReadConcern.get(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);

      const deleteResponse = await cacheClientWithConsistentReadConcern.delete(
        integrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(deleteResponse).toBeInstanceOf(CacheDelete.Success);
      }, `expected SUCCESS but got ${deleteResponse.toString()}`);
      const getMiss = await cacheClientWithConsistentReadConcern.get(
        integrationTestCacheName,
        cacheKey
      );
      expect(getMiss).toBeInstanceOf(CacheGet.Miss);
    });
  });
}
