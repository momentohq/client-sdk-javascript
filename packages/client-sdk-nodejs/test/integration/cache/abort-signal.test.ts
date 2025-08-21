import {SetupIntegrationTest} from '../integration-setup';
import {v4} from 'uuid';
import {CacheGetResponse, CacheSetResponse} from '@gomomento/sdk-core';

const {cacheClient, cacheClientWithoutRetryStrategy, integrationTestCacheName} =
  SetupIntegrationTest();

const numTrials = 3;

async function testTrials(trial: Promise<boolean>) {
  const trials = [];
  for (let i = 0; i < numTrials; i++) {
    trials.push(trial);
  }
  const results = await Promise.all(trials);
  // expect at least one of the trials to pass (i.e. return true)
  expect(results.some(result => result)).toBe(true);
}

describe('AbortSignal', () => {
  describe('cache client WITHOUT retry strategy', () => {
    it('should cancel a set call', async () => {
      const testSet = async () => {
        const signal = AbortSignal.timeout(1);
        const setResponse = await cacheClientWithoutRetryStrategy.set(
          integrationTestCacheName,
          v4(),
          'value',
          {
            signal,
          }
        );
        if (
          setResponse.type === CacheSetResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testSet());
    });

    it('should cancel a get call', async () => {
      const testGet = async () => {
        const signal = AbortSignal.timeout(1);
        const getResponse = await cacheClientWithoutRetryStrategy.get(
          integrationTestCacheName,
          v4(),
          {
            signal,
          }
        );
        if (
          getResponse.type === CacheGetResponse.Error &&
          getResponse.errorCode() === 'CANCELLED_ERROR' &&
          getResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
  });

  describe('cache client WITH default retry strategy', () => {
    it('should cancel a set call', async () => {
      const testSet = async () => {
        const signal = AbortSignal.timeout(1);
        const setResponse = await cacheClient.set(
          integrationTestCacheName,
          v4(),
          'value',
          {
            signal,
          }
        );
        if (
          setResponse.type === CacheSetResponse.Error &&
          setResponse.errorCode() === 'CANCELLED_ERROR' &&
          setResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testSet());
    });

    it('should cancel a get call', async () => {
      const testGet = async () => {
        const signal = AbortSignal.timeout(1);
        const getResponse = await cacheClient.get(
          integrationTestCacheName,
          v4(),
          {
            signal,
          }
        );
        if (
          getResponse.type === CacheGetResponse.Error &&
          getResponse.errorCode() === 'CANCELLED_ERROR' &&
          getResponse
            .message()
            .includes('Request cancelled by a user-provided AbortSignal')
        ) {
          return true;
        }
        return false;
      };
      await testTrials(testGet());
    });
  });
});
