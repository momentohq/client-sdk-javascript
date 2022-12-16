import {v4} from 'uuid';
import {
  SimpleCacheClient,
  NotFoundError,
  CacheGet,
  CacheDelete,
  MomentoErrorCode,
  DeleteCache,
  CreateCache,
  ListCaches,
  CacheSet,
  CreateSigningKey,
  ListSigningKeys,
  RevokeSigningKey,
} from '../src';
import {TextEncoder} from 'util';

const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;
if (!AUTH_TOKEN) {
  throw new Error('Missing required env var TEST_AUTH_TOKEN');
}
const INTEGRATION_TEST_CACHE_NAME =
  process.env.TEST_CACHE_NAME || 'js-integration-test-default';

const deleteCacheIfExists = async (
  momento: SimpleCacheClient,
  cacheName: string
) => {
  try {
    await momento.deleteCache(cacheName);
  } catch (e) {
    if (!(e instanceof NotFoundError)) {
      throw e;
    }
  }
};

beforeAll(async () => {
  const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
  await deleteCacheIfExists(momento, INTEGRATION_TEST_CACHE_NAME);
  await momento.createCache(INTEGRATION_TEST_CACHE_NAME);
});

afterAll(async () => {
  const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
  await momento.deleteCache(INTEGRATION_TEST_CACHE_NAME);
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
  it('should create and delete a cache', async () => {
    const cacheName = v4();
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    await withCache(momento, cacheName, async () => {
      await momento.set(cacheName, 'key', 'value');
      const res = await momento.get(cacheName, 'key');
      expect(res instanceof CacheGet.Error).toEqual(false);
      if (res instanceof CacheGet.Hit) {
        expect(res.valueString()).toEqual('value');
      }
    });
  });
  it('should return NotFoundError if deleting a non-existent cache', async () => {
    const cacheName = v4();
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    const deleteResponse = await momento.deleteCache(cacheName);
    expect(deleteResponse instanceof DeleteCache.Error).toEqual(true);
    if (deleteResponse instanceof DeleteCache.Error) {
      expect(deleteResponse.errorCode()).toEqual(
        MomentoErrorCode.NOT_FOUND_ERROR
      );
    }
  });
  it('should return AlreadyExists response if trying to create a cache that already exists', async () => {
    const cacheName = v4();
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    await withCache(momento, cacheName, async () => {
      const createResponse = await momento.createCache(cacheName);
      expect(createResponse instanceof CreateCache.AlreadyExists).toEqual(true);
    });
  });
  it('should create 1 cache and list the created cache', async () => {
    const cacheName = v4();
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    await withCache(momento, cacheName, async () => {
      const listResponse = await momento.listCaches();
      expect(listResponse instanceof ListCaches.Error).toEqual(false);
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
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    const setResponse = await momento.set(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey,
      cacheValue
    );
    expect(setResponse instanceof CacheSet.Error).toEqual(false);
    const getResponse = await momento.get(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey
    );
    expect(getResponse instanceof CacheGet.Error).toEqual(false);
    expect(getResponse instanceof CacheGet.Miss).toEqual(false);
    if (getResponse instanceof CacheGet.Hit) {
      expect(getResponse.valueString()).toEqual(cacheValue);
    }
  });
  it('should set and get bytes from cache', async () => {
    const cacheKey = new TextEncoder().encode(v4());
    const cacheValue = new TextEncoder().encode(v4());
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    const setResponse = await momento.set(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey,
      cacheValue
    );
    expect(setResponse instanceof CacheSet.Error).toEqual(false);
    const getResponse = await momento.get(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey
    );
    expect(getResponse instanceof CacheGet.Error).toEqual(false);
    expect(getResponse instanceof CacheGet.Miss).toEqual(false);
    if (getResponse instanceof CacheGet.Hit) {
      expect(getResponse.valueBytes()).toEqual(cacheValue);
    }
  });
  it('should set string key with bytes value', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    const setResponse = await momento.set(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey,
      cacheValue
    );
    expect(setResponse instanceof CacheSet.Error).toEqual(false);
    const getResponse = await momento.get(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey
    );
    expect(getResponse instanceof CacheGet.Error).toEqual(false);
    expect(getResponse instanceof CacheGet.Miss).toEqual(false);
    if (getResponse instanceof CacheGet.Hit) {
      expect(getResponse.valueBytes()).toEqual(cacheValue);
    }
  });
  it('should set byte key with string value', async () => {
    const cacheValue = v4();
    const cacheKey = new TextEncoder().encode(v4());
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    const setResponse = await momento.set(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey,
      cacheValue
    );
    expect(setResponse instanceof CacheSet.Error).toEqual(false);
    const getResponse = await momento.get(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey
    );
    expect(getResponse instanceof CacheGet.Error).toEqual(false);
    expect(getResponse instanceof CacheGet.Miss).toEqual(false);
    if (getResponse instanceof CacheGet.Hit) {
      expect(getResponse.valueString()).toEqual(cacheValue);
    }
  });
  it('should set and get string from cache and returned set value matches string cacheValue', async () => {
    const cacheKey = v4();
    const cacheValue = v4();
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    const setResponse = await momento.set(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey,
      cacheValue
    );
    expect(setResponse instanceof CacheSet.Error).toEqual(false);
    if (setResponse instanceof CacheSet.Success) {
      expect(setResponse.valueString()).toEqual(cacheValue);
    }
  });
  it('should set string key with bytes value and returned set value matches byte cacheValue', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    const setResponse = await momento.set(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey,
      cacheValue
    );
    expect(setResponse instanceof CacheSet.Error).toEqual(false);
    if (setResponse instanceof CacheSet.Success) {
      expect(setResponse.valueBytes()).toEqual(cacheValue);
    }
  });
  it('should timeout on a request that exceeds specified timeout', async () => {
    const cacheName = v4();
    const defaultTimeoutClient = new SimpleCacheClient(AUTH_TOKEN, 1111);
    const shortTimeoutClient = new SimpleCacheClient(AUTH_TOKEN, 1111, {
      requestTimeoutMs: 1,
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
      expect(setResponse instanceof CacheSet.Error).toEqual(true);
      if (setResponse instanceof CacheSet.Error) {
        expect(setResponse.errorCode()).toEqual(MomentoErrorCode.TIMEOUT_ERROR);
      }
    });
  });
  it('should set and then delete a value in cache', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
    const getResponse = await momento.get(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey
    );
    expect(getResponse instanceof CacheGet.Error).toEqual(false);
    expect(getResponse instanceof CacheGet.Miss).toEqual(false);
    if (getResponse instanceof CacheGet.Hit) {
      expect(getResponse.valueBytes()).toEqual(cacheValue);
    }

    const deleteResponse = await momento.delete(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey
    );
    expect(deleteResponse instanceof CacheDelete.Success).toEqual(true);
    const getMiss = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
    expect(getMiss instanceof CacheGet.Miss).toEqual(true);
  });
  it('should return a miss response for a nonexistent cache key', async () => {
    const cacheKey = v4();
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    const deleteResponse = await momento.delete(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey
    );
    expect(deleteResponse instanceof CacheDelete.Error).toEqual(false);
    const missResponse = await momento.get(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey
    );
    expect(missResponse instanceof CacheGet.Miss).toEqual(true);
  });
  it('should create, list, and revoke a signing key', async () => {
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    const createSigningKeyResponse = await momento.createSigningKey(30);
    expect(createSigningKeyResponse instanceof CreateSigningKey.Error).toEqual(
      false
    );
    let listSigningKeysResponse = await momento.listSigningKeys();
    expect(listSigningKeysResponse instanceof ListSigningKeys.Error).toEqual(
      false
    );
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
    expect(revokeResponse instanceof RevokeSigningKey.Error).toEqual(false);
    listSigningKeysResponse = await momento.listSigningKeys();
    expect(listSigningKeysResponse instanceof ListSigningKeys.Error).toEqual(
      false
    );
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
