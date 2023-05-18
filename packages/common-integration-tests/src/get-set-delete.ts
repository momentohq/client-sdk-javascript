import {v4} from 'uuid';
import {
  CacheDelete,
  CacheGet,
  CacheIncrement,
  CacheSet,
  CacheSetIfNotExists,
  MomentoErrorCode,
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
  Momento: ICacheClient,
  MomentoShortDeadline: ICacheClient,
  IntegrationTestCacheName: string
) {
  describe('get/set/delete', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return Momento.get(props.cacheName, v4());
    });
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return Momento.set(props.cacheName, v4(), v4());
    });
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return Momento.delete(props.cacheName, v4());
    });

    it('should set and get string from cache', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const setResponse = await Momento.set(
        IntegrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
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
      const setResponse = await Momento.set(
        IntegrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
    });

    it('should set string key with bytes value', async () => {
      const cacheKey = v4();
      const cacheValue = new TextEncoder().encode(v4());
      const decodedValue = new TextDecoder().decode(cacheValue);
      const setResponse = await Momento.set(
        IntegrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
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
      const setResponse = await Momento.set(
        IntegrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
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
      const setResponse = await Momento.set(
        IntegrationTestCacheName,
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
      const setResponse = await Momento.set(
        IntegrationTestCacheName,
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
      await Momento.set(IntegrationTestCacheName, cacheKey, cacheValue);
      const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);

      const deleteResponse = await Momento.delete(
        IntegrationTestCacheName,
        cacheKey
      );
      expectWithMessage(() => {
        expect(deleteResponse).toBeInstanceOf(CacheDelete.Success);
      }, `expected SUCCESS but got ${deleteResponse.toString()}`);
      const getMiss = await Momento.get(IntegrationTestCacheName, cacheKey);
      expect(getMiss).toBeInstanceOf(CacheGet.Miss);
    });

    it('should return INVALID_ARGUMENT_ERROR for invalid ttl when set with string key/value', async () => {
      const setResponse = await Momento.set(
        IntegrationTestCacheName,
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
      const setResponse = await Momento.set(
        IntegrationTestCacheName,
        cacheKey,
        cacheValue,
        {ttl: 15}
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);

      const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });

    it('should set with valid ttl and should return miss when ttl is expired', async () => {
      const cacheKey = v4();
      const setResponse = await Momento.set(
        IntegrationTestCacheName,
        cacheKey,
        v4(),
        {ttl: 1}
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS but got ${setResponse.toString()}`);
      await sleep(3000);

      const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Miss);
      }, `expected MISS but got ${getResponse.toString()}`);
    });
  });

  describe('#increment', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return Momento.increment(props.cacheName, v4(), 1);
    });

    it('increments from 0 to expected amount with string field', async () => {
      const field = v4();
      let response = await Momento.increment(
        IntegrationTestCacheName,
        field,
        1
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncrement.Success);
      }, `expected SUCCESS but got ${response.toString()}`);
      let successResponse = response as CacheIncrement.Success;
      expect(successResponse.valueNumber()).toEqual(1);

      response = await Momento.increment(IntegrationTestCacheName, field, 41);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncrement.Success);
      }, `expected SUCCESS but got ${response.toString()}`);
      successResponse = response as CacheIncrement.Success;
      expect(successResponse.valueNumber()).toEqual(42);
      expect(successResponse.toString()).toEqual('Success: value: 42');

      response = await Momento.increment(
        IntegrationTestCacheName,
        field,
        -1042
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncrement.Success);
      }, `expected SUCCESS but got ${response.toString()}`);
      successResponse = response as CacheIncrement.Success;
      expect(successResponse.valueNumber()).toEqual(-1000);

      response = await Momento.get(IntegrationTestCacheName, field);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${response.toString()}`);
      const hitResponse = response as CacheGet.Hit;
      expect(hitResponse.valueString()).toEqual('-1000');
    });

    it('increments from 0 to expected amount with Uint8Array field', async () => {
      const field = new TextEncoder().encode(v4());
      let response = await Momento.increment(
        IntegrationTestCacheName,
        field,
        1
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncrement.Success);
      }, `expected SUCCESS but got ${response.toString()}`);
      let successResponse = response as CacheIncrement.Success;
      expect(successResponse.valueNumber()).toEqual(1);

      response = await Momento.increment(IntegrationTestCacheName, field, 41);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncrement.Success);
      }, `expected SUCCESS but got ${response.toString()}`);
      successResponse = response as CacheIncrement.Success;
      expect(successResponse.valueNumber()).toEqual(42);
      expect(successResponse.toString()).toEqual('Success: value: 42');

      response = await Momento.increment(
        IntegrationTestCacheName,
        field,
        -1042
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncrement.Success);
      }, `expected SUCCESS but got ${response.toString()}`);
      successResponse = response as CacheIncrement.Success;
      expect(successResponse.valueNumber()).toEqual(-1000);

      response = await Momento.get(IntegrationTestCacheName, field);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${response.toString()}`);
      const hitResponse = response as CacheGet.Hit;
      expect(hitResponse.valueString()).toEqual('-1000');
    });

    it('increments with setting and resetting field', async () => {
      const field = v4();

      await Momento.set(IntegrationTestCacheName, field, '10');
      let response = await Momento.increment(
        IntegrationTestCacheName,
        field,
        0
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncrement.Success);
      }, `expected SUCCESS but got ${response.toString()}`);
      let successResponse = response as CacheIncrement.Success;
      expect(successResponse.valueNumber()).toEqual(10);

      response = await Momento.increment(IntegrationTestCacheName, field, 90);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncrement.Success);
      }, `expected SUCCESS but got ${response.toString()}`);
      successResponse = response as CacheIncrement.Success;
      expect(successResponse.valueNumber()).toEqual(100);

      // Reset field
      await Momento.set(IntegrationTestCacheName, field, '0');
      response = await Momento.increment(IntegrationTestCacheName, field, 0);
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(CacheIncrement.Success);
      }, `expected SUCCESS but got ${response.toString()}`);
      successResponse = response as CacheIncrement.Success;
      expect(successResponse.valueNumber()).toEqual(0);
    });

    it('fails with precondition with a bad amount', async () => {
      const field = v4();

      await Momento.set(IntegrationTestCacheName, field, 'abcxyz');
      const response = await Momento.increment(
        IntegrationTestCacheName,
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
  });

  describe('#setIfNotExists', () => {
    ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
      return Momento.setIfNotExists(props.cacheName, v4(), v4());
    });

    it('should set and get string from cache', async () => {
      const cacheKey = v4();
      const cacheValue = v4();
      const setResponse = await Momento.setIfNotExists(
        IntegrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
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
      const setResponse = await Momento.setIfNotExists(
        IntegrationTestCacheName,
        cacheKey,
        cacheValueOld
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const setIfNotExistsResponse = await Momento.setIfNotExists(
        IntegrationTestCacheName,
        cacheKey,
        cacheValueNew
      );
      expectWithMessage(() => {
        expect(setIfNotExistsResponse).toBeInstanceOf(
          CacheSetIfNotExists.NotStored
        );
      }, `expected NOTSTORED but goit ${setIfNotExistsResponse.toString()}`);
      const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
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
      const setResponse = await Momento.setIfNotExists(
        IntegrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT but got ${getResponse.toString()}`);
    });

    it('should set string key with bytes value', async () => {
      const cacheKey = v4();
      const cacheValue = new TextEncoder().encode(v4());
      const decodedValue = new TextDecoder().decode(cacheValue);
      const setResponse = await Momento.setIfNotExists(
        IntegrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
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
      const setResponse = await Momento.setIfNotExists(
        IntegrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
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
      const setResponse = await Momento.setIfNotExists(
        IntegrationTestCacheName,
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
      const setResponse = await Momento.setIfNotExists(
        IntegrationTestCacheName,
        cacheKey,
        cacheValue
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
    });

    it('should return INVALID_ARGUMENT_ERROR for invalid ttl when set with string key/value', async () => {
      const setResponse = await Momento.setIfNotExists(
        IntegrationTestCacheName,
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
      const setResponse = await Momento.setIfNotExists(
        IntegrationTestCacheName,
        cacheKey,
        cacheValue,
        {ttl: 15}
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);

      const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
      if (getResponse instanceof CacheGet.Hit) {
        expect(getResponse.valueString()).toEqual(cacheValue);
      }
    });

    it('should set with valid ttl and should return miss when ttl is expired', async () => {
      const cacheKey = v4();
      const setResponse = await Momento.setIfNotExists(
        IntegrationTestCacheName,
        cacheKey,
        v4(),
        {ttl: 1}
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Stored);
      }, `expected STORED but got ${setResponse.toString()}`);
      await sleep(3000);

      const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(CacheGet.Miss);
      }, `expected MISS but got ${getResponse.toString()}`);
    });

    it('should respect client timeout values', async () => {
      console.log('\n\n\n\n\n-------->');
      console.log(MomentoShortDeadline);
      const cacheKey = v4();
      const setResponse = await MomentoShortDeadline.set(
        IntegrationTestCacheName,
        cacheKey,
        v4()
      );
      console.log(setResponse);
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(CacheSet.Error);
      }, `expected ERROR but got ${setResponse.toString()}`);
      const respErrorCode = (setResponse as CacheSet.Error).errorCode();
      expectWithMessage(() => {
        expect(respErrorCode).toEqual(MomentoErrorCode.TIMEOUT_ERROR);
      }, `expected TIMEOUT but got ${respErrorCode}`);
    });
  });
}
