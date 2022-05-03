import {v4} from 'uuid';
import * as fs from 'fs';
import * as os from 'os';
import {CacheGetStatus, SimpleCacheClient, TimeoutError} from '../src';
import {AlreadyExistsError, NotFoundError} from '../src/Errors';
import {TextEncoder} from 'util';

const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;
if (!AUTH_TOKEN) {
  throw new Error('Missing required env var TEST_AUTH_TOKEN');
}
const INTEGRATION_TEST_CACHE_NAME =
  process.env.TEST_CACHE_NAME || 'js-integration-test-default';

const momentoDirName = `${os.homedir()}/.momento-test`;
const credsFilePath = `${momentoDirName}/credentials`;
const createSystemCredentials = (profile?: string) => {
  const profileName = profile ?? 'default';
  if (profile) {
    process.env.MOMENTO_PROFILE = profileName;
  }
  if (!fs.existsSync(momentoDirName)) {
    fs.mkdirSync(momentoDirName);
  } else {
    throw new Error(`${momentoDirName} directory exists.
These integration tests test reading profiles from disk, and create a ~/.momento-test directory to test this.`);
  }
  fs.writeFileSync(
    credsFilePath,
    `[profile.${profileName}]
token = "${AUTH_TOKEN}"`
  );
};

const removeSystemCredentials = () => {
  fs.rmSync(momentoDirName, {
    force: true,
    recursive: true,
  });
};

const deleteExistingCache = async (
  momento: SimpleCacheClient,
  cacheName: string
) => {
  try {
    await momento.deleteCache(cacheName);
  } catch (e) {
    console.log(e);
  }
};

let momento: SimpleCacheClient;

beforeAll(async () => {
  momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
  await deleteExistingCache(momento, INTEGRATION_TEST_CACHE_NAME);
  await momento.createCache(INTEGRATION_TEST_CACHE_NAME);
});

afterAll(async () => {
  await momento.deleteCache(INTEGRATION_TEST_CACHE_NAME);
});

describe('SimpleCacheClient.ts Integration Tests', () => {
  it('should create and delete a cache', async () => {
    const cacheName = v4();
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    await deleteExistingCache(momento, cacheName);
    await momento.createCache(cacheName);
    await momento.set(cacheName, 'key', 'value');
    const res = await momento.get(cacheName, 'key');
    expect(res.text()).toEqual('value');
    await momento.deleteCache(cacheName);
  });
  it('should throw CacheNotFoundError if deleting a non-existent cache', async () => {
    const cacheName = v4();
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    await expect(momento.deleteCache(cacheName)).rejects.toThrow(NotFoundError);
  });
  it('should throw CacheAlreadyExistsError if trying to create a cache that already exists', async () => {
    const cacheName = v4();
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    await deleteExistingCache(momento, cacheName);
    await momento.createCache(cacheName);
    await expect(momento.createCache(cacheName)).rejects.toThrow(
      AlreadyExistsError
    );
    await momento.deleteCache(cacheName);
  });

  it('should use the default auth token from ~/.momento-test/credentials', async () => {
    createSystemCredentials();
    const cacheName = v4();
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    try {
      await deleteExistingCache(momento, cacheName);
      await momento.createCache(cacheName);
      await expect(momento.createCache(cacheName)).rejects.toThrow(
        AlreadyExistsError
      );
      await momento.deleteCache(cacheName);
    } finally {
      removeSystemCredentials();
    }
  });

  it('should use the MOMENTO_PROFILE auth token from ~/.momento-test/credentials', async () => {
    createSystemCredentials('profile2');
    const cacheName = v4();
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    try {
      await deleteExistingCache(momento, cacheName);
      await momento.createCache(cacheName);
      await expect(momento.createCache(cacheName)).rejects.toThrow(
        AlreadyExistsError
      );
      await momento.deleteCache(cacheName);
    } finally {
      removeSystemCredentials();
    }
  });

  it('should create 1 cache and list the created cache', async () => {
    const cacheName = v4();
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    await deleteExistingCache(momento, cacheName);
    await momento.createCache(cacheName);
    const caches = (await momento.listCaches()).getCaches();
    const names = caches.map(c => c.getName());
    expect(names.includes(cacheName)).toBeTruthy();
    await momento.deleteCache(cacheName);
  });

  it('should set and get string from cache', async () => {
    const cacheKey = v4();
    const cacheValue = v4();
    await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
    const res = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
    expect(res.text()).toEqual(cacheValue);
  });
  it('should set and get bytes from cache', async () => {
    const cacheKey = new TextEncoder().encode(v4());
    const cacheValue = new TextEncoder().encode(v4());
    await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
    const res = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
    expect(res.bytes()).toEqual(cacheValue);
  });
  it('should set string key with bytes value', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
    const res = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
    expect(res.bytes()).toEqual(cacheValue);
  });
  it('should set byte key with string value', async () => {
    const cacheValue = v4();
    const cacheKey = new TextEncoder().encode(v4());
    await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
    const res = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
    expect(res.text()).toEqual(cacheValue);
  });
  it('should set and get string from cache and returned set value matches string cacheValue', async () => {
    const cacheKey = v4();
    const cacheValue = v4();
    const setResult = await momento.set(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey,
      cacheValue
    );
    expect(setResult.text()).toEqual(cacheValue);
  });
  it('should set string key with bytes value and returned set value matches byte cacheValue', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    const setResult = await momento.set(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey,
      cacheValue
    );
    expect(setResult.bytes()).toEqual(cacheValue);
  });
  it('should terminate connection for a short deadline', async () => {
    const cacheName = v4();
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111, 1);
    await deleteExistingCache(momento, cacheName);
    await momento.createCache(cacheName);
    const cacheKey = v4();
    // Create a longer cache value that should take longer than 1ms to send
    const cacheValue = new TextEncoder().encode(v4().repeat(10));
    await expect(momento.set(cacheName, cacheKey, cacheValue)).rejects.toThrow(
      TimeoutError
    );
    await momento.deleteCache(cacheName);
  });
  it('should set and then delete a value in cache', async () => {
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
    const getSuccess = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
    // validate set worked correctly
    expect(getSuccess.bytes()).toEqual(cacheValue);

    await momento.delete(INTEGRATION_TEST_CACHE_NAME, cacheKey);
    const getMiss = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
    expect(getMiss.status).toEqual(CacheGetStatus.Miss);
  });
  it('should create, list, and revoke a signing key', async () => {
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    const createSigningKeyResponse = await momento.createSigningKey(30);
    let listSigningKeysResponse = await momento.listSigningKeys();
    let signingKeys = listSigningKeysResponse.getSigningKeys();
    expect(signingKeys.length).toBeGreaterThan(0);
    expect(
      signingKeys
        .map(k => k.getKeyId())
        .some(k => k === createSigningKeyResponse.getKeyId())
    ).toEqual(true);
    await momento.revokeSigningKey(createSigningKeyResponse.getKeyId());
    listSigningKeysResponse = await momento.listSigningKeys();
    signingKeys = listSigningKeysResponse.getSigningKeys();
    expect(
      signingKeys
        .map(k => k.getKeyId())
        .some(k => k === createSigningKeyResponse.getKeyId())
    ).toEqual(false);
  });
});
