import {expectWithMessage} from '@gomomento/common-integration-tests';
import {SetupIntegrationTest} from './integration-setup';
import {CacheGet, CacheSet} from '@gomomento/sdk-core';

const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();

describe('CacheClient', () => {
  it('should send and receive 5mb messages', async () => {
    const value = 'a'.repeat(5_000_000);
    const key = '5mb';

    const setResponse = await cacheClient.set(
      integrationTestCacheName,
      key,
      value
    );
    expectWithMessage(() => {
      expect(setResponse).toBeInstanceOf(CacheSet.Success);
    }, `expected to successfully set 5mb string for key ${key}, received ${setResponse.toString()}`);

    const getResponse = await cacheClient.get(integrationTestCacheName, '5mb');
    expectWithMessage(() => {
      expect(getResponse).toBeInstanceOf(CacheGet.Hit);
    }, `expected to successfully get 5mb string for key ${key}, received ${getResponse.toString()}`);

    const responseValue = (getResponse as CacheGet.Hit).value();
    expectWithMessage(() => {
      expect(responseValue).toEqual(value);
    }, `expected 5mb retrieved string to match 5mb value that was set for key ${key}`);
  });
});
