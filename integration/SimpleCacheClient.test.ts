import {v4} from 'uuid';
import * as fs from 'fs';
import * as os from 'os';
import {SimpleCacheClient} from '../src';
import {AlreadyExistsError, NotFoundError} from '../src/Errors';
import {TextEncoder} from 'util';

const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;
if (!AUTH_TOKEN) {
  throw new Error('Missing required env var TEST_AUTH_TOKEN');
}
const INTEGRATION_TEST_CACHE_NAME = process.env.TEST_CACHE_NAME || 'dummy';

const momentoDirName = `${os.homedir()}/.momento`;
const credsFilePath = `${momentoDirName}/credentials.toml`;

const createSystemCredentials = (profile?: string) => {
  const profileName = profile ?? 'default';
  if (profile) {
    process.env.MOMENTO_PROFILE = profileName;
  }
  if (!fs.existsSync(momentoDirName)) {
    fs.mkdirSync(momentoDirName);
  } else {
    throw new Error(`${momentoDirName} directory exists.
These integration tests test reading profiles from disk, and create a ~/.momento directory to test this.
To avoid overriding existing profiles, this error has been thrown.
If you a want to run these tests, run "mv ~/.momento ~/.momento.bac" to save the current profiles.
After these tests complete run "mv ~/.momento.bac ~/.momento" to restore the profiles`);
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

describe('SimpleCacheClient.ts Integration Tests', () => {
  it('should create and delete a cache', async () => {
    const cacheName = v4();
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
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
    await momento.createCache(cacheName);
    await expect(momento.createCache(cacheName)).rejects.toThrow(
      AlreadyExistsError
    );
    await momento.deleteCache(cacheName);
  });
  // TODO: deprecating credentials file for now
  // it('should use the default auth token from ~/.momento/credentials.toml', async () => {
  //   createSystemCredentials();
  //   const cacheName = v4();
  //   const momento = new Momento();
  //   await momento.createCache(cacheName);
  //   await expect(momento.createCache(cacheName)).rejects.toThrow(
  //     AlreadyExistsError
  //   );
  //   await momento.deleteCache(cacheName);
  //
  //   removeSystemCredentials();
  // });
  //
  // it('should use the MOMENTO_PROFILE auth token from ~/.momento/credentials.toml', async () => {
  //   createSystemCredentials('profile2');
  //   const cacheName = v4();
  //   const momento = new Momento();
  //   await momento.createCache(cacheName);
  //   await expect(momento.createCache(cacheName)).rejects.toThrow(
  //     AlreadyExistsError
  //   );
  //   await momento.deleteCache(cacheName);
  //   removeSystemCredentials();
  // });

  it('should create 1 cache and list the created cache', async () => {
    const cacheName1 = v4();
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    await momento.createCache(cacheName1);
    const caches = (await momento.listCaches()).getCaches();
    const names = caches.map(c => c.getName());
    expect(names.includes(cacheName1)).toBeTruthy();
    await momento.deleteCache(cacheName1);
  });

  it('should set and get string from cache', async () => {
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    const cacheKey = v4();
    const cacheValue = v4();
    await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
    const res = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
    expect(res.text()).toEqual(cacheValue);
  });
  it('should set and get bytes from cache', async () => {
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    const cacheKey = new TextEncoder().encode(v4());
    const cacheValue = new TextEncoder().encode(v4());
    await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
    const res = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
    expect(res.bytes()).toEqual(cacheValue);
  });
  it('should set string key with bytes value', async () => {
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
    const res = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
    expect(res.bytes()).toEqual(cacheValue);
  });
  it('should set byte key with string value', async () => {
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    const cacheValue = v4();
    const cacheKey = new TextEncoder().encode(v4());
    await momento.set(INTEGRATION_TEST_CACHE_NAME, cacheKey, cacheValue);
    const res = await momento.get(INTEGRATION_TEST_CACHE_NAME, cacheKey);
    expect(res.text()).toEqual(cacheValue);
  });
  it('should set and get string from cache and returned set value matches string cacheValue', async () => {
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
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
    const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
    const cacheKey = v4();
    const cacheValue = new TextEncoder().encode(v4());
    const setResult = await momento.set(
      INTEGRATION_TEST_CACHE_NAME,
      cacheKey,
      cacheValue
    );
    expect(setResult.bytes()).toEqual(cacheValue);
  });
});
