import {v4} from 'uuid';
import {
  CacheDelete,
  CacheGet,
  CacheIncrement,
  CacheItemGetTtl,
  CacheSet,
  CacheSetIfNotExists,
  MomentoErrorCode,
  FailedPreconditionError,
} from '@gomomento/sdk-core';
import {TextEncoder} from 'util';
import {
  ValidateCacheProps,
  ItBehavesLikeItValidatesCacheName,
  expectWithMessage,
} from './common-int-test-utils';
import {sleep} from '@gomomento/sdk-core/dist/src/internal/utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/internal/clients/cache';

export function runGetSetDeleteTests(
  cacheClient: ICacheClient,
  cacheClientWithThrowOnErrors: ICacheClient,
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

    it('should return INVALID_ARGUMENT_ERROR for invalid ttl when set with string key/value', async () => {
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
      }, `expected NOTSTORED but goit ${setIfNotExistsResponse.toString()}`);
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
}
