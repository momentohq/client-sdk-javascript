import {SetupIntegrationTest} from '../integration-setup';
import {v4} from 'uuid';
import {
  CacheGet,
  CacheGetResponse,
  CacheSet,
  CacheSetResponse,
} from '@gomomento/sdk-core';

const {cacheClient, cacheClientWithoutRetryStrategy, integrationTestCacheName} =
  SetupIntegrationTest();

describe('AbortSignal', () => {
  describe('cache client WITHOUT retry strategy', () => {
    it('should cancel a set call', async () => {
      const signal = AbortSignal.timeout(1);
      const setResponse = await cacheClientWithoutRetryStrategy.set(
        integrationTestCacheName,
        v4(),
        'value',
        {
          signal,
        }
      );
      expect(setResponse).toBeInstanceOf(CacheSet.Error);
      if (setResponse.type === CacheSetResponse.Error) {
        expect(setResponse.errorCode()).toEqual('CANCELLED_ERROR');
        expect(setResponse.message()).toContain(
          'Request cancelled by a user-provided AbortSignal'
        );
      }
    });

    it('should cancel a get call', async () => {
      const signal = AbortSignal.timeout(1);
      const getResponse = await cacheClientWithoutRetryStrategy.get(
        integrationTestCacheName,
        v4(),
        {
          signal,
        }
      );
      expect(getResponse).toBeInstanceOf(CacheGet.Error);
      if (getResponse.type === CacheGetResponse.Error) {
        expect(getResponse.errorCode()).toEqual('CANCELLED_ERROR');
        expect(getResponse.message()).toContain(
          'Request cancelled by a user-provided AbortSignal'
        );
      }
    });
  });

  describe('cache client WITH default retry strategy', () => {
    it('should cancel a set call', async () => {
      const signal = AbortSignal.timeout(1);
      const setResponse = await cacheClient.set(
        integrationTestCacheName,
        v4(),
        'value',
        {
          signal,
        }
      );
      expect(setResponse).toBeInstanceOf(CacheSet.Error);
      if (setResponse.type === CacheSetResponse.Error) {
        expect(setResponse.errorCode()).toEqual('CANCELLED_ERROR');
        expect(setResponse.message()).toContain(
          'Request cancelled by a user-provided AbortSignal'
        );
      }
    });

    it('should cancel a get call', async () => {
      const signal = AbortSignal.timeout(1);
      const getResponse = await cacheClient.get(
        integrationTestCacheName,
        v4(),
        {
          signal,
        }
      );
      expect(getResponse).toBeInstanceOf(CacheGet.Error);
      if (getResponse.type === CacheGetResponse.Error) {
        expect(getResponse.errorCode()).toEqual('CANCELLED_ERROR');
        expect(getResponse.message()).toContain(
          'Request cancelled by a user-provided AbortSignal'
        );
      }
    });
  });
});
