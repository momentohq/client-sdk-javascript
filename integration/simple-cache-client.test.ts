import {v4} from 'uuid';
import {
  EnvMomentoTokenProvider,
  CacheDelete,
  CacheGet,
  CacheSet,
  Configurations,
  CreateCache,
  CreateSigningKey,
  DeleteCache,
  ListCaches,
  ListSigningKeys,
  MomentoErrorCode,
  RevokeSigningKey,
  CacheSetFetch,
  SimpleCacheClient,
  CacheDictionaryFetch,
  CacheDictionarySetField,
  CacheDictionarySetFields,
  CacheDictionaryGetField,
  CacheDictionaryGetFields,
  CacheDictionaryRemoveField,
  CacheDictionaryRemoveFields,
  CacheDictionaryIncrement,
} from '../src';
import {TextEncoder} from 'util';
import {SimpleCacheClientProps} from '../src/simple-cache-client-props';
import {CollectionTtl} from '../src/utils/collection-ttl';

const credentialProvider = new EnvMomentoTokenProvider('TEST_AUTH_TOKEN');
const configuration = Configurations.Laptop.latest();
const cacheClientProps: SimpleCacheClientProps = {
  configuration: configuration,
  credentialProvider: credentialProvider,
  defaultTtlSeconds: 1111,
};
const INTEGRATION_TEST_CACHE_NAME =
  process.env.TEST_CACHE_NAME || 'js-integration-test-default';

const deleteCacheIfExists = async (
  momento: SimpleCacheClient,
  cacheName: string
) => {
  const deleteResponse = await momento.deleteCache(cacheName);
  if (deleteResponse instanceof DeleteCache.Error) {
    if (deleteResponse.errorCode() !== MomentoErrorCode.NOT_FOUND_ERROR) {
      throw deleteResponse.innerException();
    }
  }
};

let momento: SimpleCacheClient;
beforeAll(() => {
  momento = new SimpleCacheClient(cacheClientProps);
});

beforeAll(async () => {
  // Use a fresh client to avoid test interference with setup.
  const momento = new SimpleCacheClient(cacheClientProps);
  await deleteCacheIfExists(momento, INTEGRATION_TEST_CACHE_NAME);
  const createResponse = await momento.createCache(INTEGRATION_TEST_CACHE_NAME);
  if (createResponse instanceof CreateCache.Error) {
    throw createResponse.innerException();
  }
});

afterAll(async () => {
  // Use a fresh client to avoid test interference with teardown.
  const momento = new SimpleCacheClient(cacheClientProps);
  const deleteResponse = await momento.deleteCache(INTEGRATION_TEST_CACHE_NAME);
  if (deleteResponse instanceof DeleteCache.Error) {
    throw deleteResponse.innerException();
  }
});

async function withCache(
  client: SimpleCacheClient,
  cacheName: string,
  block: () => Promise<void>
) {
  await deleteCacheIfExists(client, cacheName);
  await client.createCache(cacheName);
  try {
    await block();
  } finally {
    await deleteCacheIfExists(client, cacheName);
  }
}

describe('SimpleCacheClient.ts Integration Tests', () => {
  it('should create and delete a cache, set and get a value', async () => {
    const cacheName = v4();
    await withCache(momento, cacheName, async () => {
      const setResponse = await momento.set(cacheName, 'key', 'value');
      expect(setResponse).toBeInstanceOf(CacheSet.Success);
      const res = await momento.get(cacheName, 'key');
      expect(res).toBeInstanceOf(CacheGet.Hit);
      if (res instanceof CacheGet.Hit) {
        expect(res.valueString()).toEqual('value');
      }
    });
  });
  it('should return NotFoundError if deleting a non-existent cache', async () => {
    const cacheName = v4();
    const deleteResponse = await momento.deleteCache(cacheName);
    expect(deleteResponse).toBeInstanceOf(DeleteCache.Response);
    expect(deleteResponse).toBeInstanceOf(DeleteCache.Error);
    if (deleteResponse instanceof DeleteCache.Error) {
      expect(deleteResponse.errorCode()).toEqual(
        MomentoErrorCode.NOT_FOUND_ERROR
      );
    }
  });
  it('should return AlreadyExists response if trying to create a cache that already exists', async () => {
    const cacheName = v4();
    await withCache(momento, cacheName, async () => {
      const createResponse = await momento.createCache(cacheName);
      expect(createResponse).toBeInstanceOf(CreateCache.AlreadyExists);
    });
  });
  it('should create 1 cache and list the created cache', async () => {
    const cacheName = v4();
    await withCache(momento, cacheName, async () => {
      const listResponse = await momento.listCaches();
      expect(listResponse).toBeInstanceOf(ListCaches.Success);
      if (listResponse instanceof ListCaches.Success) {
        const caches = listResponse.getCaches();
        const names = caches.map(c => c.getName());
        expect(names.includes(cacheName)).toBeTruthy();
      }
    });
  });
  it('should set and get string from cache', async () => {
    const cacheKey = v4();
    const cacheValue = v4();
    const setResponse = await momento.set(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey,
      cacheValue
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
    const getResponse = await momento.get(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey
    );
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);
    if (getResponse instanceof CacheGet.Hit) {
      expect(getResponse.valueString()).toEqual(cacheValue);
    }
  });
  it('should set and get bytes from cache', async () => {
    const cacheKey = new TextEncoder().encode(v4());
    const cacheValue = new TextEncoder().encode(v4());
    const setResponse = await momento.set(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey,
      cacheValue
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
    const getResponse = await momento.get(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey
    );
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);
  });
  it('should set string key with bytes value', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    const setResponse = await momento.set(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey,
      cacheValue
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
  });
  it('should set byte key with string value', async () => {
    const cacheValue = v4();
    const cacheKey = new TextEncoder().encode(v4());
    const setResponse = await momento.set(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey,
      cacheValue
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
    const getResponse = await momento.get(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey
    );
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);
    if (getResponse instanceof CacheGet.Hit) {
      expect(getResponse.valueString()).toEqual(cacheValue);
    }
  });
  it('should set and get string from cache and returned set value matches string cacheValue', async () => {
    const cacheKey = v4();
    const cacheValue = v4();
    const setResponse = await momento.set(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey,
      cacheValue
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
  });
  it('should set string key with bytes value and returned set value matches byte cacheValue', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    const setResponse = await momento.set(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey,
      cacheValue
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Success);
  });
  it('should timeout on a request that exceeds specified timeout', async () => {
    const cacheName = v4();
    const defaultTimeoutClient = momento;
    const shortTimeoutTransportStrategy = configuration
      .getTransportStrategy()
      .withClientTimeoutMillis(1);
    const shortTimeoutConfiguration = configuration.withTransportStrategy(
      shortTimeoutTransportStrategy
    );
    const shortTimeoutClient = new SimpleCacheClient({
      configuration: shortTimeoutConfiguration,
      credentialProvider: credentialProvider,
      defaultTtlSeconds: 1111,
    });
    await withCache(defaultTimeoutClient, cacheName, async () => {
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
    await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
    const getResponse = await momento.get(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey
    );
    expect(getResponse).toBeInstanceOf(CacheGet.Hit);

    const deleteResponse = await momento.delete(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey
    );
    expect(deleteResponse).toBeInstanceOf(CacheDelete.Success);
    const getMiss = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
    expect(getMiss).toBeInstanceOf(CacheGet.Miss);
  });
  it('should return InvalidArgument response for set, get, and delete with empty key', async () => {
    const setResponse = await momento.set(
      INTEGRATION_TEST_CACHE_NAME,
      '',
      'foo'
    );
    expect(setResponse).toBeInstanceOf(CacheSet.Error);
    expect((setResponse as CacheSet.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
    const getResponse = await momento.get(INTEGRATION_TEST_CACHE_NAME, '');
    expect(getResponse).toBeInstanceOf(CacheGet.Error);
    expect((getResponse as CacheGet.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
    const deleteResponse = await momento.delete(
      INTEGRATION_TEST_CACHE_NAME,
      ''
    );
    expect(deleteResponse).toBeInstanceOf(CacheDelete.Error);
    expect((deleteResponse as CacheDelete.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
  });
  it('should return InvalidArgument response for set, get, and delete with invalid cache name', async () => {
    const setResponse = await momento.set('', 'bar', 'foo');
    expect(setResponse).toBeInstanceOf(CacheSet.Error);
    expect((setResponse as CacheSet.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
    const getResponse = await momento.get('', 'bar');
    expect(getResponse).toBeInstanceOf(CacheGet.Error);
    expect((getResponse as CacheDelete.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
    const deleteResponse = await momento.delete('', 'bar');
    expect(deleteResponse).toBeInstanceOf(CacheDelete.Error);
    expect((deleteResponse as CacheDelete.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
  });
  it('should return InvalidArgument response for set request with empty key or value', async () => {
    const noKeySetResponse = await momento.set(
      INTEGRATION_TEST_CACHE_NAME,
      '',
      'value'
    );
    expect(noKeySetResponse).toBeInstanceOf(CacheSet.Error);
    expect((noKeySetResponse as CacheSet.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
    const noValueSetResponse = await momento.set(
      INTEGRATION_TEST_CACHE_NAME,
      'key',
      ''
    );
    expect(noValueSetResponse).toBeInstanceOf(CacheSet.Error);
    expect((noValueSetResponse as CacheSet.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
  });
  it('should return InvalidArgument response for get request with empty key', async () => {
    const noKeyGetResponse = await momento.get(INTEGRATION_TEST_CACHE_NAME, '');
    expect(noKeyGetResponse).toBeInstanceOf(CacheGet.Error);
    expect((noKeyGetResponse as CacheGet.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
  });
  it('should create, list, and revoke a signing key', async () => {
    const createSigningKeyResponse = await momento.createSigningKey(30);
    expect(createSigningKeyResponse).toBeInstanceOf(CreateSigningKey.Success);
    let listSigningKeysResponse = await momento.listSigningKeys();
    expect(listSigningKeysResponse).toBeInstanceOf(ListSigningKeys.Success);
    let signingKeys = (
      listSigningKeysResponse as ListSigningKeys.Success
    ).getSigningKeys();
    expect(signingKeys.length).toBeGreaterThan(0);
    expect(
      signingKeys
        .map(k => k.getKeyId())
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        .some(
          k =>
            k ===
            (createSigningKeyResponse as CreateSigningKey.Success).getKeyId()
        )
    ).toEqual(true);
    const revokeResponse = await momento.revokeSigningKey(
      (createSigningKeyResponse as CreateSigningKey.Success).getKeyId()
    );
    expect(revokeResponse).toBeInstanceOf(RevokeSigningKey.Success);
    listSigningKeysResponse = await momento.listSigningKeys();
    expect(listSigningKeysResponse).toBeInstanceOf(ListSigningKeys.Success);
    signingKeys = (
      listSigningKeysResponse as ListSigningKeys.Success
    ).getSigningKeys();
    expect(
      signingKeys
        .map(k => k.getKeyId())
        .some(
          k =>
            k ===
            (createSigningKeyResponse as CreateSigningKey.Success).getKeyId()
        )
    ).toEqual(false);
  });
});

describe('Integration Tests for operations on sets datastructure', () => {
  it('should return MISS if set does not exist', async () => {
    const noKeyGetResponse = await momento.setFetch(
      INTEGRATION_TEST_CACHE_NAME,
      'this-set-doesnt-exist'
    );
    expect(noKeyGetResponse).toBeInstanceOf(CacheSetFetch.Miss);
  });
});

describe('Integration tests for dictionary operations', () => {
  it('should return InvalidArgument response for dictionaryGetField with invalid cache/dictionary/field/value name', async () => {
    const dictionaryGetFieldResponse1 = await momento.dictionaryGetField(
      '',
      'myDictionary',
      'myField'
    );
    expect(dictionaryGetFieldResponse1).toBeInstanceOf(
      CacheDictionaryGetField.Error
    );
    expect(
      (dictionaryGetFieldResponse1 as CacheDictionaryGetField.Error).errorCode()
    ).toEqual(MomentoErrorCode.INVALID_ARGUMENT_ERROR);
    const dictionaryGetFieldResponse2 = await momento.dictionaryGetField(
      'cache',
      '',
      'myField'
    );
    expect(dictionaryGetFieldResponse2).toBeInstanceOf(
      CacheDictionaryGetField.Error
    );
    expect(
      (dictionaryGetFieldResponse2 as CacheDictionaryGetField.Error).errorCode()
    ).toEqual(MomentoErrorCode.INVALID_ARGUMENT_ERROR);
    const dictionaryGetFieldResponse3 = await momento.dictionaryGetField(
      'cache',
      'myDictionary',
      ''
    );
    expect(dictionaryGetFieldResponse3).toBeInstanceOf(
      CacheDictionaryGetField.Error
    );
    expect(
      (dictionaryGetFieldResponse3 as CacheDictionaryGetField.Error).errorCode()
    ).toEqual(MomentoErrorCode.INVALID_ARGUMENT_ERROR);
  });

  it('should return InvalidArgument response for dictionaryGetFields with invalid cache/dictionary names and fields', async () => {
    const fields = ['field1'];
    const invalidItems = [''];
    const dictionaryGetFieldsResponse1 = await momento.dictionaryGetFields(
      '',
      'myDictionary',
      fields
    );
    expect(dictionaryGetFieldsResponse1).toBeInstanceOf(
      CacheDictionaryGetFields.Error
    );
    expect(
      (
        dictionaryGetFieldsResponse1 as CacheDictionaryGetFields.Error
      ).errorCode()
    ).toEqual(MomentoErrorCode.INVALID_ARGUMENT_ERROR);
    const dictionaryGetFieldsResponse2 = await momento.dictionaryGetFields(
      'cache',
      '',
      fields
    );
    expect(dictionaryGetFieldsResponse2).toBeInstanceOf(
      CacheDictionaryGetFields.Error
    );
    expect(
      (
        dictionaryGetFieldsResponse2 as CacheDictionaryGetFields.Error
      ).errorCode()
    ).toEqual(MomentoErrorCode.INVALID_ARGUMENT_ERROR);
    const dictionaryGetFieldsResponse3 = await momento.dictionaryGetFields(
      'cache',
      'myDictionary',
      invalidItems
    );
    expect(dictionaryGetFieldsResponse3).toBeInstanceOf(
      CacheDictionaryGetFields.Error
    );
    expect(
      (
        dictionaryGetFieldsResponse3 as CacheDictionaryGetFields.Error
      ).errorCode()
    ).toEqual(MomentoErrorCode.INVALID_ARGUMENT_ERROR);
  });

  it('should return InvalidArgument response for dictionarySetField with invalid cache/dictionary/field/value name', async () => {
    const dictionarySetFieldResponse1 = await momento.dictionarySetField(
      '',
      'myDictionary',
      'myField',
      'myValue'
    );
    expect(dictionarySetFieldResponse1).toBeInstanceOf(
      CacheDictionarySetField.Error
    );
    expect(
      (dictionarySetFieldResponse1 as CacheDictionarySetField.Error).errorCode()
    ).toEqual(MomentoErrorCode.INVALID_ARGUMENT_ERROR);
    const dictionarySetFieldResponse2 = await momento.dictionarySetField(
      'cache',
      '',
      'myField',
      'myValue'
    );
    expect(dictionarySetFieldResponse2).toBeInstanceOf(
      CacheDictionarySetField.Error
    );
    expect(
      (dictionarySetFieldResponse2 as CacheDictionarySetField.Error).errorCode()
    ).toEqual(MomentoErrorCode.INVALID_ARGUMENT_ERROR);
    const dictionarySetFieldResponse3 = await momento.dictionarySetField(
      'cache',
      'myDictionary',
      '',
      'myValue'
    );
    expect(dictionarySetFieldResponse3).toBeInstanceOf(
      CacheDictionarySetField.Error
    );
    expect(
      (dictionarySetFieldResponse3 as CacheDictionarySetField.Error).errorCode()
    ).toEqual(MomentoErrorCode.INVALID_ARGUMENT_ERROR);
    const dictionarySetFieldResponse4 = await momento.dictionarySetField(
      'cache',
      'myDictionary',
      'myField',
      ''
    );
    expect(dictionarySetFieldResponse4).toBeInstanceOf(
      CacheDictionarySetField.Error
    );
    expect(
      (dictionarySetFieldResponse4 as CacheDictionarySetField.Error).errorCode()
    ).toEqual(MomentoErrorCode.INVALID_ARGUMENT_ERROR);
  });

  it('should return InvalidArgument response for dictionarySetFields with invalid cache/dictionary names and items', async () => {
    const items = [{field: 'field', value: 'value'}];
    const invalidItems = [{field: '', value: ''}];
    const dictionarySetFieldsResponse1 = await momento.dictionarySetFields(
      '',
      'myDictionary',
      items
    );
    expect(dictionarySetFieldsResponse1).toBeInstanceOf(
      CacheDictionarySetFields.Error
    );
    expect(
      (
        dictionarySetFieldsResponse1 as CacheDictionarySetFields.Error
      ).errorCode()
    ).toEqual(MomentoErrorCode.INVALID_ARGUMENT_ERROR);
    const dictionarySetFieldsResponse2 = await momento.dictionarySetFields(
      'cache',
      '',
      items
    );
    expect(dictionarySetFieldsResponse2).toBeInstanceOf(
      CacheDictionarySetFields.Error
    );
    expect(
      (
        dictionarySetFieldsResponse2 as CacheDictionarySetFields.Error
      ).errorCode()
    ).toEqual(MomentoErrorCode.INVALID_ARGUMENT_ERROR);
    const dictionarySetFieldsResponse3 = await momento.dictionarySetFields(
      'cache',
      'myDictionary',
      invalidItems
    );
    expect(dictionarySetFieldsResponse3).toBeInstanceOf(
      CacheDictionarySetFields.Error
    );
    expect(
      (
        dictionarySetFieldsResponse3 as CacheDictionarySetFields.Error
      ).errorCode()
    ).toEqual(MomentoErrorCode.INVALID_ARGUMENT_ERROR);
  });

  it('should set/get a dictionary with Uint8Array field/value', async () => {
    const dictionaryName = v4();
    const field = new TextEncoder().encode(v4());
    const value = new TextEncoder().encode(v4());
    const response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      value
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    if (getResponse instanceof CacheDictionaryGetField.Hit) {
      expect(getResponse.valueUint8Array()).toEqual(value);
    }
  });

  it('should return MISS when field does not present for dictionaryGetField with Uint8Array field/value', async () => {
    const dictionaryName = v4();
    const field = new TextEncoder().encode(v4());
    const value = new TextEncoder().encode(v4());
    const otherField = new TextEncoder().encode(v4());
    const response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      value
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      otherField
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should dictionarySet/GetField with Uint8Array field/value with no refresh ttl', async () => {
    const dictionaryName = v4();
    const field = new TextEncoder().encode(v4());
    const value = new TextEncoder().encode(v4());
    let response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(5).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    await new Promise(r => setTimeout(r, 100));

    response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(10).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    await new Promise(r => setTimeout(r, 4900));

    response = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should dictionarySet/GetField with Uint8Array field/value with refresh ttl', async () => {
    const dictionaryName = v4();
    const field = new TextEncoder().encode(v4());
    const value = new TextEncoder().encode(v4());
    let response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(2)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);

    response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(10)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    await new Promise(r => setTimeout(r, 2000));

    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    if (getResponse instanceof CacheDictionaryGetField.Hit) {
      expect(getResponse.valueUint8Array()).toEqual(value);
    }
  });

  it('should return MISS if dictionary does not exist for dictionaryGetField', async () => {
    const dictionaryName = v4();
    const field = new TextEncoder().encode(v4());
    const response = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(response).toBeInstanceOf(CacheDictionaryGetField.Miss);
    if (response instanceof CacheDictionaryGetField.Hit) {
      expect(response.valueUint8Array()).toEqual(field);
    }
  });

  it('should set/get a dictionary with string field/value', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = v4();
    const response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      value
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    if (getResponse instanceof CacheDictionaryGetField.Hit) {
      expect(getResponse.valueString()).toEqual(value);
    }
  });

  it('should set/get a dictionary with string field/value and return expected toString value', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = v4();
    const response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      value
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    expect((getResponse as CacheDictionaryGetField.Hit).toString()).toEqual(
      `${value.substring(0, 32)}...`
    );
  });

  it('should return MISS when field does not present for dictionaryGetField with string field/value', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = v4();
    const otherField = v4();
    const response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      value
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      otherField
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should dictionarySet/GetField with string field/value with no refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = v4();
    let response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(5).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    await new Promise(r => setTimeout(r, 100));

    response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(10).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    await new Promise(r => setTimeout(r, 4900));

    response = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should dictionarySet/GetField with string field/value with refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = v4();
    let response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(2)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);

    response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(10)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    await new Promise(r => setTimeout(r, 2000));

    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    expect((getResponse as CacheDictionaryGetField.Hit).valueString()).toEqual(
      value
    );
  });

  it('should set/get a dictionary with string field and Uint8Array value', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = new TextEncoder().encode(v4());
    const response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      value
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    expect(
      (getResponse as CacheDictionaryGetField.Hit).valueUint8Array()
    ).toEqual(value);
  });

  it('should dictionarySet/GetField with string field, Uint8Array value with no refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = new TextEncoder().encode(v4());
    let response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(5).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    await new Promise(r => setTimeout(r, 100));

    response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(10).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    await new Promise(r => setTimeout(r, 4900));

    response = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should dictionarySet/GetField with string field, Uint8Array value with refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = new TextEncoder().encode(v4());
    let response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(2)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);

    response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      value,
      CollectionTtl.of(10)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    await new Promise(r => setTimeout(r, 2000));

    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    expect(
      (getResponse as CacheDictionaryGetField.Hit).valueUint8Array()
    ).toEqual(value);
  });

  it('should dictionarySetFields/dictionaryGetField with Uint8Array items', async () => {
    const dictionaryName = v4();
    const field1 = new TextEncoder().encode(v4());
    const value1 = new TextEncoder().encode(v4());
    const field2 = new TextEncoder().encode(v4());
    const value2 = new TextEncoder().encode(v4());
    const response = await momento.dictionarySetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      [
        {field: field1, value: value1},
        {field: field2, value: value2},
      ],
      CollectionTtl.of(10)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    let getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field1
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    if (getResponse instanceof CacheDictionaryGetField.Hit) {
      expect(getResponse.valueUint8Array()).toEqual(value1);
    }
    getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field2
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    if (getResponse instanceof CacheDictionaryGetField.Hit) {
      expect(getResponse.valueUint8Array()).toEqual(value2);
    }
  });

  it('should dictionarySetFields/dictionaryGetField with Uint8Array items with no refresh ttl', async () => {
    const dictionaryName = v4();
    const field = new TextEncoder().encode(v4());
    const value = new TextEncoder().encode(v4());
    const content = [{field, value}];
    let response = await momento.dictionarySetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      content,
      CollectionTtl.of(5).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    await new Promise(r => setTimeout(r, 100));

    response = await momento.dictionarySetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      content,
      CollectionTtl.of(10).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    await new Promise(r => setTimeout(r, 4900));

    response = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should dictionarySetFields/dictionaryGetField with Uint8Array field/value with refresh ttl', async () => {
    const dictionaryName = v4();
    const field = new TextEncoder().encode(v4());
    const value = new TextEncoder().encode(v4());
    const content = [{field, value}];
    let response = await momento.dictionarySetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      content,
      CollectionTtl.of(2)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);

    response = await momento.dictionarySetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      content,
      CollectionTtl.of(10)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    await new Promise(r => setTimeout(r, 2000));

    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    if (getResponse instanceof CacheDictionaryGetField.Hit) {
      expect(getResponse.valueUint8Array()).toEqual(value);
    }
  });

  it('should dictionarySetFields/dictionaryGetField with string items', async () => {
    const dictionaryName = v4();
    const field1 = v4();
    const value1 = v4();
    const field2 = v4();
    const value2 = v4();
    const response = await momento.dictionarySetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      [
        {field: field1, value: value1},
        {field: field2, value: value2},
      ],
      CollectionTtl.of(10)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    let getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field1
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    if (getResponse instanceof CacheDictionaryGetField.Hit) {
      expect(getResponse.valueString()).toEqual(value1);
    }
    getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field2
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    if (getResponse instanceof CacheDictionaryGetField.Hit) {
      expect(getResponse.valueString()).toEqual(value2);
    }
  });

  it('should dictionarySetFields/dictionaryGetField with string items with no refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = v4();
    const content = [{field, value}];
    let response = await momento.dictionarySetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      content,
      CollectionTtl.of(5).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    await new Promise(r => setTimeout(r, 100));

    response = await momento.dictionarySetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      content,
      CollectionTtl.of(10).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    await new Promise(r => setTimeout(r, 4900));

    response = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should dictionarySetFields/dictionaryGetField with string field/value with refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = v4();
    const content = [{field, value}];
    let response = await momento.dictionarySetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      content,
      CollectionTtl.of(2)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);

    response = await momento.dictionarySetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      content,
      CollectionTtl.of(10)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    await new Promise(r => setTimeout(r, 2000));

    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    if (getResponse instanceof CacheDictionaryGetField.Hit) {
      expect(getResponse.valueString()).toEqual(value);
    }
  });

  it('should dictionarySetFields/dictionaryGetField with string field/Uint8Array value items', async () => {
    const dictionaryName = v4();
    const field1 = v4();
    const value1 = new TextEncoder().encode(v4());
    const field2 = v4();
    const value2 = new TextEncoder().encode(v4());
    const response = await momento.dictionarySetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      [
        {field: field1, value: value1},
        {field: field2, value: value2},
      ],
      CollectionTtl.of(10)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    let getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field1
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    if (getResponse instanceof CacheDictionaryGetField.Hit) {
      expect(getResponse.valueUint8Array()).toEqual(value1);
    }
    getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field2
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    if (getResponse instanceof CacheDictionaryGetField.Hit) {
      expect(getResponse.valueUint8Array()).toEqual(value2);
    }
  });

  it('should dictionarySetFields/dictionaryGetField with string field/Uint8Array value with no refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = new TextEncoder().encode(v4());
    const content = [{field, value}];
    let response = await momento.dictionarySetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      content,
      CollectionTtl.of(5).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    await new Promise(r => setTimeout(r, 100));

    response = await momento.dictionarySetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      content,
      CollectionTtl.of(10).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    await new Promise(r => setTimeout(r, 4900));

    response = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should dictionarySetFields/dictionaryGetField with string field/Uint8Array value with refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    const value = new TextEncoder().encode(v4());
    const content = [{field, value}];
    let response = await momento.dictionarySetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      content,
      CollectionTtl.of(2)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);

    response = await momento.dictionarySetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      content,
      CollectionTtl.of(10)
    );
    expect(response).toBeInstanceOf(CacheDictionarySetFields.Success);
    await new Promise(r => setTimeout(r, 2000));

    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    if (getResponse instanceof CacheDictionaryGetField.Hit) {
      expect(getResponse.valueUint8Array()).toEqual(value);
    }
  });

  it('should dictionarySetField/dictionaryGetFields with Uint8Array fields/values', async () => {
    const dictionaryName = v4();
    const field1 = new TextEncoder().encode(v4());
    const value1 = new TextEncoder().encode(v4());
    const field2 = new TextEncoder().encode(v4());
    const value2 = new TextEncoder().encode(v4());
    const field3 = new TextEncoder().encode(v4());
    let response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field1,
      value1
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field2,
      value2
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    const getResponse = await momento.dictionaryGetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      [field1, field2, field3]
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetFields.Hit);
    const hitResponse = getResponse as CacheDictionaryGetFields.Hit;
    expect(hitResponse.responsesList).toHaveLength(3);
    expect(hitResponse.responsesList[0]).toBeInstanceOf(
      CacheDictionaryGetField.Hit
    );
    const hitResponse1 = hitResponse
      .responsesList[0] as CacheDictionaryGetField.Hit;
    expect(hitResponse1.fieldUint8Array()).toEqual(field1);

    expect(hitResponse.responsesList[1]).toBeInstanceOf(
      CacheDictionaryGetField.Hit
    );
    const hitResponse2 = hitResponse
      .responsesList[1] as CacheDictionaryGetField.Hit;
    expect(hitResponse2.fieldUint8Array()).toEqual(field2);

    expect(hitResponse.responsesList[2]).toBeInstanceOf(
      CacheDictionaryGetField.Miss
    );
    const missResponse = hitResponse
      .responsesList[2] as CacheDictionaryGetField.Miss;
    expect(missResponse.fieldUint8Array()).toEqual(field3);

    const expectedMap = new Map<Uint8Array, Uint8Array>([
      [field1, value1],
      [field2, value2],
    ]);
    expect(expectedMap).toEqual(
      hitResponse.valueDictionaryUint8ArrayUint8Array()
    );
  });

  it('should return MISS if dictionary does not exist for dictionaryGetFields', async () => {
    const dictionaryName = v4();
    const field1 = new TextEncoder().encode(v4());
    const field2 = new TextEncoder().encode(v4());
    const field3 = new TextEncoder().encode(v4());
    const response = await momento.dictionaryGetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      [field1, field2, field3]
    );
    expect(response).toBeInstanceOf(CacheDictionaryGetFields.Miss);
  });

  it('should dictionarySetField/dictionaryGetFields with string fields/values', async () => {
    const dictionaryName = v4();
    const field1 = v4();
    const value1 = v4();
    const field2 = v4();
    const value2 = v4();
    const field3 = v4();
    let response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field1,
      value1
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    response = await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field2,
      value2
    );
    expect(response).toBeInstanceOf(CacheDictionarySetField.Success);
    const getResponse = await momento.dictionaryGetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      [field1, field2, field3]
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetFields.Hit);
    const hitResponse = getResponse as CacheDictionaryGetFields.Hit;
    expect(hitResponse.responsesList).toHaveLength(3);
    expect(hitResponse.responsesList[0]).toBeInstanceOf(
      CacheDictionaryGetField.Hit
    );
    const hitResponse1 = hitResponse
      .responsesList[0] as CacheDictionaryGetField.Hit;
    expect(hitResponse1.fieldString()).toEqual(field1);

    expect(hitResponse.responsesList[1]).toBeInstanceOf(
      CacheDictionaryGetField.Hit
    );
    const hitResponse2 = hitResponse
      .responsesList[1] as CacheDictionaryGetField.Hit;
    expect(hitResponse2.fieldString()).toEqual(field2);

    expect(hitResponse.responsesList[2]).toBeInstanceOf(
      CacheDictionaryGetField.Miss
    );
    const missResponse = hitResponse
      .responsesList[2] as CacheDictionaryGetField.Miss;
    expect(missResponse.fieldString()).toEqual(field3);

    const expectedMap = new Map<string, string>([
      [field1, value1],
      [field2, value2],
    ]);
    expect(expectedMap).toEqual(hitResponse.valueDictionaryStringString());

    const otherDictionary = hitResponse.valueDictionaryStringUint8Array();
    expect(otherDictionary.size).toEqual(2);
    expect(otherDictionary.get(field1)).toEqual(
      new TextEncoder().encode(value1)
    );
    expect(otherDictionary.get(field2)).toEqual(
      new TextEncoder().encode(value2)
    );
  });

  it('should dictionarySetField/dictionaryGetFields with string field/value and return expected toString value', async () => {
    const dictionaryName = v4();
    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      'a',
      'b'
    );
    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      'c',
      'd'
    );
    const getResponse = await momento.dictionaryGetFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      ['a', 'c']
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetFields.Hit);
    expect((getResponse as CacheDictionaryGetFields.Hit).toString()).toEqual(
      `Hit: valueDictionaryStringString: a: b, c: d`
    );
  });

  it('should return a map of string field and string value with dictionaryFetch', async () => {
    const dictionaryName = v4();
    const field1 = v4();
    const value1 = v4();
    const field2 = v4();
    const value2 = v4();
    const contentDictionary = new Map<string, string>([
      [field1, value1],
      [field2, value2],
    ]);
    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field1,
      value1
    );
    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field2,
      value2
    );
    const response = await momento.dictionaryFetch(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName
    );
    expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);
    const hitResponse = response as CacheDictionaryFetch.Hit;
    expect(hitResponse.valueDictionaryStringString()).toEqual(
      contentDictionary
    );
  });

  it('should return expected toString value with dictionaryFetch', async () => {
    const dictionaryName = v4();
    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      'a',
      'b'
    );
    const response = await momento.dictionaryFetch(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName
    );
    expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);
    expect((response as CacheDictionaryFetch.Hit).toString()).toEqual(
      `Hit: valueDictionaryStringString: a: b`
    );
  });

  it('should return a map of Uint8Array field and Uint8Array value with dictionaryFetch', async () => {
    const dictionaryName = v4();
    const field1 = new TextEncoder().encode(v4());
    const value1 = new TextEncoder().encode(v4());
    const field2 = new TextEncoder().encode(v4());
    const value2 = new TextEncoder().encode(v4());
    const contentDictionary = new Map<Uint8Array, Uint8Array>([
      [field1, value1],
      [field2, value2],
    ]);
    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field1,
      value1
    );
    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field2,
      value2
    );
    const response = await momento.dictionaryFetch(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName
    );
    expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);
    const hitResponse = response as CacheDictionaryFetch.Hit;
    expect(hitResponse.valueDictionaryUint8ArrayUint8Array()).toEqual(
      contentDictionary
    );
  });

  it('should return a map of string field and Uint8Array value with dictionaryFetch', async () => {
    const dictionaryName = v4();
    const field1 = v4();
    const value1 = new TextEncoder().encode(v4());
    const field2 = v4();
    const value2 = new TextEncoder().encode(v4());
    const contentDictionary = new Map<string, Uint8Array>([
      [field1, value1],
      [field2, value2],
    ]);
    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field1,
      value1
    );
    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field2,
      value2
    );
    const response = await momento.dictionaryFetch(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName
    );
    expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);
    const hitResponse = response as CacheDictionaryFetch.Hit;
    expect(hitResponse.valueDictionaryStringUint8Array()).toEqual(
      contentDictionary
    );
  });

  it('should return InvalidArgument response for dictionary fetch with invalid cache/dictionary name', async () => {
    const fetchResponse1 = await momento.dictionaryFetch('', 'myDictionary');
    expect(fetchResponse1).toBeInstanceOf(CacheDictionaryFetch.Error);
    expect((fetchResponse1 as CacheDictionaryFetch.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
    const fetchResponse2 = await momento.dictionaryFetch('cache', '');
    expect(fetchResponse2).toBeInstanceOf(CacheDictionaryFetch.Error);
    expect((fetchResponse2 as CacheDictionaryFetch.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
  });

  it('should return MISS if dictionary does not exist for dictionaryFetch', async () => {
    const fetchResponse = await momento.dictionaryFetch(
      INTEGRATION_TEST_CACHE_NAME,
      'nonExistingDictionary'
    );
    expect(fetchResponse).toBeInstanceOf(CacheDictionaryFetch.Miss);
  });

  it('should do nothing with dictionaryFetch if dictionary does not exist', async () => {
    const dictionaryName = v4();
    let response = await momento.dictionaryFetch(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName
    );
    expect(response).toBeInstanceOf(CacheDictionaryFetch.Miss);
    response = await momento.delete(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName
    );
    expect(response).toBeInstanceOf(CacheDelete.Success);
    response = await momento.dictionaryFetch(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName
    );
    expect(response).toBeInstanceOf(CacheDictionaryFetch.Miss);
  });

  it('should delete with dictionaryFetch if dictionary exists', async () => {
    const dictionaryName = v4();
    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      v4(),
      v4()
    );
    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      v4(),
      v4()
    );
    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      v4(),
      v4()
    );

    let response = await momento.dictionaryFetch(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName
    );
    expect(response).toBeInstanceOf(CacheDictionaryFetch.Hit);
    response = await momento.delete(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName
    );
    expect(response).toBeInstanceOf(CacheDelete.Success);
    response = await momento.dictionaryFetch(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName
    );
    expect(response).toBeInstanceOf(CacheDictionaryFetch.Miss);
  });

  it('should return InvalidArgument response for dictionaryRemoveField with invalid cache/dictionary/field name', async () => {
    let response = await momento.dictionaryRemoveField(
      '',
      'myDictionary',
      'myField'
    );
    expect(response).toBeInstanceOf(CacheDictionaryRemoveField.Error);
    expect((response as CacheDictionaryRemoveField.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
    response = await momento.dictionaryRemoveField('cache', '', 'myField');
    expect(response).toBeInstanceOf(CacheDictionaryRemoveField.Error);
    expect((response as CacheDictionaryRemoveField.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
    response = await momento.dictionaryRemoveField('cache', 'myDictionary', '');
    expect(response).toBeInstanceOf(CacheDictionaryRemoveField.Error);
    expect((response as CacheDictionaryRemoveField.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
  });

  it('should remove a dictionary with dictionaryRemoveField with Uint8Array field', async () => {
    const dictionaryName = v4();
    const field1 = new TextEncoder().encode(v4());
    const value1 = new TextEncoder().encode(v4());
    const field2 = new TextEncoder().encode(v4());

    expect(
      await momento.dictionaryGetField(
        INTEGRATION_TEST_CACHE_NAME,
        dictionaryName,
        field1
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);
    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field1,
      value1
    );
    expect(
      await momento.dictionaryGetField(
        INTEGRATION_TEST_CACHE_NAME,
        dictionaryName,
        field1
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Hit);

    await momento.dictionaryRemoveField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field1
    );
    expect(
      await momento.dictionaryGetField(
        INTEGRATION_TEST_CACHE_NAME,
        dictionaryName,
        field1
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);

    // Test no-op
    expect(
      await momento.dictionaryGetField(
        INTEGRATION_TEST_CACHE_NAME,
        dictionaryName,
        field2
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);
    await momento.dictionaryRemoveField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field2
    );
    expect(
      await momento.dictionaryGetField(
        INTEGRATION_TEST_CACHE_NAME,
        dictionaryName,
        field2
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should remove a dictionary with dictionaryRemoveField with string field', async () => {
    const dictionaryName = v4();
    const field1 = v4();
    const value1 = v4();
    const field2 = v4();

    expect(
      await momento.dictionaryGetField(
        INTEGRATION_TEST_CACHE_NAME,
        dictionaryName,
        field1
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);
    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field1,
      value1
    );
    expect(
      await momento.dictionaryGetField(
        INTEGRATION_TEST_CACHE_NAME,
        dictionaryName,
        field1
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Hit);

    await momento.dictionaryRemoveField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field1
    );
    expect(
      await momento.dictionaryGetField(
        INTEGRATION_TEST_CACHE_NAME,
        dictionaryName,
        field1
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);

    // Test no-op
    expect(
      await momento.dictionaryGetField(
        INTEGRATION_TEST_CACHE_NAME,
        dictionaryName,
        field2
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);
    await momento.dictionaryRemoveField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field2
    );
    expect(
      await momento.dictionaryGetField(
        INTEGRATION_TEST_CACHE_NAME,
        dictionaryName,
        field2
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should return InvalidArgument response for dictionaryRemoveFields with invalid cache/dictionary/field name', async () => {
    let response = await momento.dictionaryRemoveFields('', 'myDictionary', [
      'myField',
    ]);
    expect(response).toBeInstanceOf(CacheDictionaryRemoveFields.Error);
    expect((response as CacheDictionaryRemoveFields.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
    response = await momento.dictionaryRemoveFields('cache', '', ['myField']);
    expect(response).toBeInstanceOf(CacheDictionaryRemoveFields.Error);
    expect((response as CacheDictionaryRemoveFields.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
    response = await momento.dictionaryRemoveFields('cache', 'myDictionary', [
      '',
    ]);
    expect(response).toBeInstanceOf(CacheDictionaryRemoveFields.Error);
    expect((response as CacheDictionaryRemoveFields.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
  });

  it('should remove a dictionary with dictionaryRemoveFields with string field', async () => {
    const dictionaryName = v4();
    const fields = [v4(), v4()];
    const otherField = v4();

    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      fields[0],
      v4()
    );
    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      fields[1],
      v4()
    );
    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      otherField,
      v4()
    );

    await momento.dictionaryRemoveFields(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      fields
    );
    expect(
      await momento.dictionaryGetField(
        INTEGRATION_TEST_CACHE_NAME,
        dictionaryName,
        fields[0]
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);
    expect(
      await momento.dictionaryGetField(
        INTEGRATION_TEST_CACHE_NAME,
        dictionaryName,
        fields[1]
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Miss);
    expect(
      await momento.dictionaryGetField(
        INTEGRATION_TEST_CACHE_NAME,
        dictionaryName,
        otherField
      )
    ).toBeInstanceOf(CacheDictionaryGetField.Hit);
  });

  it('should return InvalidArgument response for dictionaryIncrement with invalid cache/dictionary/field name', async () => {
    let response = await momento.dictionaryIncrement(
      '',
      'myDictionary',
      'myField'
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Error);
    expect((response as CacheDictionaryIncrement.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
    response = await momento.dictionaryIncrement('cache', '', 'myField');
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Error);
    expect((response as CacheDictionaryIncrement.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
    response = await momento.dictionaryIncrement('cache', 'myDictionary', '');
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Error);
    expect((response as CacheDictionaryIncrement.Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
  });

  it('should increment from 0 to expected amount with dictionaryIncrement', async () => {
    const dictionaryName = v4();
    const field = v4();
    let response = await momento.dictionaryIncrement(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      1
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    let successResponse = response as CacheDictionaryIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(1);

    response = await momento.dictionaryIncrement(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      41
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    successResponse = response as CacheDictionaryIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(42);
    expect(successResponse.toString()).toEqual('Success: value: 42');

    response = await momento.dictionaryIncrement(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      -1042
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    successResponse = response as CacheDictionaryIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(-1000);

    response = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(response).toBeInstanceOf(CacheDictionaryGetField.Hit);
    const hitResponse = response as CacheDictionaryGetField.Hit;
    expect(hitResponse.valueString()).toEqual('-1000');
  });

  it('should dictionaryIncrement with no refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    let response = await momento.dictionaryIncrement(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      undefined,
      CollectionTtl.of(5).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    await new Promise(r => setTimeout(r, 100));

    response = await momento.dictionaryIncrement(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      undefined,
      CollectionTtl.of(10).withNoRefreshTtlOnUpdates()
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    await new Promise(r => setTimeout(r, 4900));

    response = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Miss);
  });

  it('should dictionaryIncrement with refresh ttl', async () => {
    const dictionaryName = v4();
    const field = v4();
    let response = await momento.dictionaryIncrement(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      undefined,
      CollectionTtl.of(2)
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);

    response = await momento.dictionaryIncrement(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      undefined,
      CollectionTtl.of(10)
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    await new Promise(r => setTimeout(r, 2000));

    const getResponse = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(getResponse).toBeInstanceOf(CacheDictionaryGetField.Hit);
    if (getResponse instanceof CacheDictionaryGetField.Hit) {
      expect(getResponse.valueString()).toEqual('2');
    }
  });

  it('should dictionaryIncrement successfully with setting and resetting field', async () => {
    const dictionaryName = v4();
    const field = v4();

    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      '10'
    );
    let response = await momento.dictionaryIncrement(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      0
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    let successResponse = response as CacheDictionaryIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(10);

    response = await momento.dictionaryIncrement(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      90
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    successResponse = response as CacheDictionaryIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(100);

    // Reset field
    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      '0'
    );
    response = await momento.dictionaryGetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect((response as CacheDictionaryGetField.Hit).valueString()).toEqual(
      '0'
    );

    response = await momento.dictionaryIncrement(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      0
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Success);
    successResponse = response as CacheDictionaryIncrement.Success;
    expect(successResponse.valueNumber()).toEqual(0);
  });

  it('should fail with precondition with dictionaryIncrement', async () => {
    const dictionaryName = v4();
    const field = v4();

    await momento.dictionarySetField(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field,
      'abcxyz'
    );
    const response = await momento.dictionaryIncrement(
      INTEGRATION_TEST_CACHE_NAME,
      dictionaryName,
      field
    );
    expect(response).toBeInstanceOf(CacheDictionaryIncrement.Error);
    const errorResponse = response as CacheDictionaryIncrement.Error;
    expect(errorResponse.errorCode()).toEqual(
      MomentoErrorCode.FAILED_PRECONDITION_ERROR
    );
  });
});
