import {v4} from 'uuid';
import * as fs from 'fs';
import * as os from 'os';
import {Momento} from '../src';
import {CacheAlreadyExistsError, CacheNotFoundError} from '../src/Errors';

const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;
if (!AUTH_TOKEN) {
  throw new Error('Missing required env var TEST_AUTH_TOKEN');
}

const momentoDirName = `${os.homedir()}/.momento`;
const credsFilePath = `${momentoDirName}/credentials.toml`;

const createSystemCredentials = (profile?: string) => {
  const profileName = profile ?? 'default';
  if (profile) {
    process.env.MOMENTO_PROFILE = profileName;
  }
  if (!fs.existsSync(momentoDirName)) {
    fs.mkdirSync(momentoDirName);
  }
  fs.writeFileSync(
    credsFilePath,
    `[profile.${profileName}]
token = "${AUTH_TOKEN}"`
  );
};

const removeSystemCredentials = () => {
  fs.rmdirSync(momentoDirName);
};

describe('Momento.ts Integration Tests', () => {
  it('should create and delete a cache', async () => {
    const cacheName = v4();
    const momento = new Momento(AUTH_TOKEN);
    await momento.createCache(cacheName);
    const cache = await momento.getCache(cacheName, {defaultTtlSeconds: 10});
    await cache.set('key', 'value');
    const res = await cache.get('key');
    expect(res.text()).toEqual('value');
    await momento.deleteCache(cacheName);
  });
  it('should throw CacheNotFoundError if deleting a non-existent cache', async () => {
    const cacheName = v4();
    const momento = new Momento(AUTH_TOKEN);
    await expect(momento.deleteCache(cacheName)).rejects.toThrow(
      CacheNotFoundError
    );
  });
  it('should throw CacheAlreadyExistsError if trying to create a cache that already exists', async () => {
    const cacheName = v4();
    const momento = new Momento(AUTH_TOKEN);
    await momento.createCache(cacheName);
    await expect(momento.createCache(cacheName)).rejects.toThrow(
      CacheAlreadyExistsError
    );
    await momento.deleteCache(cacheName);
  });
  it('should use the default auth token from ~/.momento/credentials.toml', async () => {
    createSystemCredentials();
    const cacheName = v4();
    const momento = new Momento();
    await momento.createCache(cacheName);
    await expect(momento.createCache(cacheName)).rejects.toThrow(
      CacheAlreadyExistsError
    );
    await momento.deleteCache(cacheName);

    removeSystemCredentials();
  });

  it('should use the MOMENTO_PROFILE auth token from ~/.momento/credentials.toml', async () => {
    createSystemCredentials('profile2');
    const cacheName = v4();
    const momento = new Momento();
    await momento.createCache(cacheName);
    await expect(momento.createCache(cacheName)).rejects.toThrow(
      CacheAlreadyExistsError
    );
    await momento.deleteCache(cacheName);
    removeSystemCredentials();
  });
});
