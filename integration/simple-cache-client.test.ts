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
    expect((response as CacheDictionaryGetField.Hit).valueUint8Array()).toEqual(
      field
    );
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
    expect(
      (response as CacheDictionaryGetField.Miss).fieldUint8Array()
    ).toEqual(field);
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
});
