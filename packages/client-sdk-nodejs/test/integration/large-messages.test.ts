import {expectWithMessage} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from './integration-setup';
import {CacheGet, CacheSet} from '@gomomento/sdk-core';
import {v4} from 'uuid';

const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();

describe('CacheClient', () => {
  it('should send and receive 5mb messages', async () => {
    const value = 'a'.repeat(5_000_000);
    const key = `js-5mb-key-${v4()}`;
    const ttlSeconds = 2000; // 2000 seconds == 30 minutes

    const setResponse = await cacheClient.set(
      integrationTestCacheName,
      key,
      value,
      {ttl: ttlSeconds}
    );
    expectWithMessage(() => {
      expect(setResponse).toBeInstanceOf(CacheSet.Success);
    }, `[${new Date().toLocaleTimeString()}] expected to successfully set 5mb string for key ${key} with ttl ${ttlSeconds} seconds, received ${setResponse.toString()}`);

    const getResponse = await cacheClient.get(integrationTestCacheName, key);
    expectWithMessage(() => {
      expect(getResponse).toBeInstanceOf(CacheGet.Hit);
    }, `[${new Date().toLocaleTimeString()}] expected to successfully get 5mb string for key ${key}, received ${getResponse.toString()}`);

    const responseValue = (getResponse as CacheGet.Hit).value();
    expectWithMessage(() => {
      expect(responseValue).toEqual(value);
    }, `expected 5mb retrieved string to match 5mb value that was set for key ${key}`);
  });
});
