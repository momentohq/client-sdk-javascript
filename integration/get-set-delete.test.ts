import {v4} from 'uuid';
import {
  CollectionTtl,
  CacheDelete,
  CacheGet,
  CacheIncrement,
  CacheSet,
  CacheSetIfNotExists,
  MomentoErrorCode,
  SimpleCacheClient,
} from '../src';
import {TextEncoder} from 'util';
import {
  SetupIntegrationTest,
  ValidateCacheProps,
  CacheClientProps,
  ItBehavesLikeItValidatesCacheName,
  WithCache,
} from './integration-setup';
import {sleep} from '../src/internal/utils/sleep';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

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
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);
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
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);
  });

  it('should set string key with bytes value', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    const setResponse = await Momento.set(
      IntegrationTestCacheName,
      cacheKey,
      cacheValue
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);
    if (getResponse instanceof CacheGet.Hit) {
      expect(getResponse.valueUint8Array()).toEqual(cacheValue);
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
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);
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
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
  });

  it('should set string key with bytes value and returned set value matches byte cacheValue', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    const setResponse = await Momento.set(
      IntegrationTestCacheName,
      cacheKey,
      cacheValue
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
  });

  it('should timeout on a request that exceeds specified timeout', async () => {
    const cacheName = v4();
    const defaultTimeoutClient = Momento;
    const shortTimeoutTransportStrategy = CacheClientProps.configuration
      .getTransportStrategy()
      .withClientTimeoutMillis(1);
    const shortTimeoutConfiguration =
      CacheClientProps.configuration.withTransportStrategy(
        shortTimeoutTransportStrategy
      );
    const shortTimeoutClient = new SimpleCacheClient({
      configuration: shortTimeoutConfiguration,
      credentialProvider: CacheClientProps.credentialProvider,
      defaultTtlSeconds: 1111,
    });
    await WithCache(defaultTimeoutClient, cacheName, async () => {
      const cacheKey = v4();
      // Create a longer cache value that should take longer than 1ms to send
      const cacheValue = new TextEncoder().encode(v4().repeat(1000));
      const setResponse = await shortTimeoutClient.set(
        cacheName,
        cacheKey,
        cacheValue
      );
      expect(setResponse).toBeInstanceOf(CacheSet.Error);
      if (setResponse instanceof CacheSet.Error) {
        expect(setResponse.errorCode()).toEqual(MomentoErrorCode.TIMEOUT_ERROR);
      }
    });
  });

  it('should set and then delete a value in cache', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    await Momento.set(IntegrationTestCacheName, cacheKey, cacheValue);
    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);

    const deleteResponse = await Momento.delete(
      IntegrationTestCacheName,
      cacheKey
    );
    expect(deleteResponse).toBeInstanceOf(CacheDelete.Success);
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
    expect(setResponse).toBeInstanceOf(CacheSet.Success);

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
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
    await sleep(3000);

    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Miss);
  });
});

describe('#increment', () => {
  ItBehavesLikeItValidatesCacheName((props: ValidateCacheProps) => {
    return Momento.increment(props.cacheName, v4());
  });

  it('increments from 0 to expected amount with string field', async () => {
    const field = v4();
    let response = await Momento.increment(IntegrationTestCacheName, field, 1);
    expect(response).toBeInstanceOf(CacheIncrement.Success);
    let successResponse = response as CacheIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(1);

    response = await Momento.increment(IntegrationTestCacheName, field, 41);
    expect(response).toBeInstanceOf(CacheIncrement.Success);
    successResponse = response as CacheIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(42);
    expect(successResponse.toString()).toEqual('Success: value: 42');

    response = await Momento.increment(IntegrationTestCacheName, field, -1042);
    expect(response).toBeInstanceOf(CacheIncrement.Success);
    successResponse = response as CacheIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(-1000);

    response = await Momento.get(IntegrationTestCacheName, field);
    expect(response).toBeInstanceOf(CacheGet.Hit);
    const hitResponse = response as CacheGet.Hit;
    expect(hitResponse.valueString()).toEqual('-1000');
  });

  it('increments from 0 to expected amount with Uint8Array field', async () => {
    const field = new TextEncoder().encode(v4());
    let response = await Momento.increment(IntegrationTestCacheName, field, 1);
    expect(response).toBeInstanceOf(CacheIncrement.Success);
    let successResponse = response as CacheIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(1);

    response = await Momento.increment(IntegrationTestCacheName, field, 41);
    expect(response).toBeInstanceOf(CacheIncrement.Success);
    successResponse = response as CacheIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(42);
    expect(successResponse.toString()).toEqual('Success: value: 42');

    response = await Momento.increment(IntegrationTestCacheName, field, -1042);
    expect(response).toBeInstanceOf(CacheIncrement.Success);
    successResponse = response as CacheIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(-1000);

    response = await Momento.get(IntegrationTestCacheName, field);
    expect(response).toBeInstanceOf(CacheGet.Hit);
    const hitResponse = response as CacheGet.Hit;
    expect(hitResponse.valueString()).toEqual('-1000');
  });

  it('increments with setting and resetting field', async () => {
    const field = v4();

    await Momento.set(IntegrationTestCacheName, field, '10');
    let response = await Momento.increment(IntegrationTestCacheName, field, 0);
    expect(response).toBeInstanceOf(CacheIncrement.Success);
    let successResponse = response as CacheIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(10);

    response = await Momento.increment(IntegrationTestCacheName, field, 90);
    expect(response).toBeInstanceOf(CacheIncrement.Success);
    successResponse = response as CacheIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(100);

    // Reset field
    await Momento.set(IntegrationTestCacheName, field, '0');
    response = await Momento.increment(IntegrationTestCacheName, field, 0);
    expect(response).toBeInstanceOf(CacheIncrement.Success);
    successResponse = response as CacheIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(0);
  });

  it('fails with precondition with a bad amount', async () => {
    const field = v4();

    await Momento.set(IntegrationTestCacheName, field, 'abcxyz');
    const response = await Momento.increment(IntegrationTestCacheName, field);
    expect(response).toBeInstanceOf(CacheIncrement.Error);
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
    expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Success);
    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);
    if (getResponse instanceof CacheGet.Hit) {
      expect(getResponse.valueString()).toEqual(cacheValue);
    }
  });

  it('should not set and get string from cache when the key exists', async () => {
    const cacheKey = v4();
    const cacheValueOld = 'value1';
    const cacheValueNew = 'value2';
    const setResponse = await Momento.set(
      IntegrationTestCacheName,
      cacheKey,
      cacheValueOld
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
    const setIfNotExistsResponse = await Momento.setIfNotExists(
      IntegrationTestCacheName,
      cacheKey,
      cacheValueNew
    );
    expect(setIfNotExistsResponse).toBeInstanceOf(CacheSetIfNotExists.Success);
    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);
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
    expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Success);
    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);
  });

  it('should set string key with bytes value', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    const setResponse = await Momento.setIfNotExists(
      IntegrationTestCacheName,
      cacheKey,
      cacheValue
    );
    expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Success);
    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);
    if (getResponse instanceof CacheGet.Hit) {
      expect(getResponse.valueUint8Array()).toEqual(cacheValue);
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
    expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Success);
    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);
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
    expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Success);
  });

  it('should set string key with bytes value and returned set value matches byte cacheValue', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    const setResponse = await Momento.setIfNotExists(
      IntegrationTestCacheName,
      cacheKey,
      cacheValue
    );
    expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Success);
  });

  it('should timeout on a request that exceeds specified timeout', async () => {
    const cacheName = v4();
    const defaultTimeoutClient = Momento;
    const shortTimeoutTransportStrategy = CacheClientProps.configuration
      .getTransportStrategy()
      .withClientTimeoutMillis(1);
    const shortTimeoutConfiguration =
      CacheClientProps.configuration.withTransportStrategy(
        shortTimeoutTransportStrategy
      );
    const shortTimeoutClient = new SimpleCacheClient({
      configuration: shortTimeoutConfiguration,
      credentialProvider: CacheClientProps.credentialProvider,
      defaultTtlSeconds: 1111,
    });
    await WithCache(defaultTimeoutClient, cacheName, async () => {
      const cacheKey = v4();
      // Create a longer cache value that should take longer than 1ms to send
      const cacheValue = new TextEncoder().encode(v4().repeat(1000));
      const setResponse = await shortTimeoutClient.setIfNotExists(
        cacheName,
        cacheKey,
        cacheValue
      );
      expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Error);
      if (setResponse instanceof CacheSetIfNotExists.Error) {
        expect(setResponse.errorCode()).toEqual(MomentoErrorCode.TIMEOUT_ERROR);
      }
    });
  });

  it('should set and then delete a value in cache', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    await Momento.setIfNotExists(
      IntegrationTestCacheName,
      cacheKey,
      cacheValue
    );
    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);

    const deleteResponse = await Momento.delete(
      IntegrationTestCacheName,
      cacheKey
    );
    expect(deleteResponse).toBeInstanceOf(CacheDelete.Success);
    const getMiss = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getMiss).toBeInstanceOf(CacheGet.Miss);
  });

  it('should return INTERNAL_SERVER_ERROR for invalid ttl when set with string key/value', async () => {
    const setResponse = await Momento.setIfNotExists(
      IntegrationTestCacheName,
      v4(),
      v4(),
      {ttl: CollectionTtl.of(-1)}
    );
    expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Error);
    if (setResponse instanceof CacheSetIfNotExists.Error) {
      expect(setResponse.errorCode()).toEqual(
        MomentoErrorCode.INTERNAL_SERVER_ERROR
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
      {ttl: CollectionTtl.of(15)}
    );
    expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Success);

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
      {ttl: CollectionTtl.of(1)}
    );
    expect(setResponse).toBeInstanceOf(CacheSetIfNotExists.Success);
    await sleep(3000);

    const getResponse = await Momento.get(IntegrationTestCacheName, cacheKey);
    expect(getResponse).toBeInstanceOf(CacheGet.Miss);
  });
});
