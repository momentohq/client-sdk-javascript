import {v4} from 'uuid';
import {CacheGet, CacheSet} from '@gomomento/sdk-core';
import {expectWithMessage} from '../common-int-test-utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/internal/clients/cache';

export function runReplicaReadTests(
  cacheClientWithBalancedReadConcern: ICacheClient,
  integrationTestCacheName: string
) {
  describe('Replica Read Tests', () => {
    it('should read the latest value after replication delay using balanced read concern', async () => {
      const client = cacheClientWithBalancedReadConcern;
      const numTrials = 10;
      const delayBetweenTrials = 100;
      const replicationDelayMs = 1000;
      const trials = [];

      const trialFn = async (trialNumber: number) => {
        // Start this trial at it's own time plus a random delay
        const startDelay =
          trialNumber * delayBetweenTrials + (Math.random() - 0.5) * 10;
        await new Promise(resolve => setTimeout(resolve, startDelay));

        const cacheKey = v4();
        const cacheValue = v4();

        // Perform a set operation
        const setResponse = await client.set(
          integrationTestCacheName,
          cacheKey,
          cacheValue
        );
        expectWithMessage(() => {
          expect(setResponse).toBeInstanceOf(CacheSet.Success);
        }, `expected SUCCESS but got ${setResponse.toString()}`);

        // Wait for replication to complete
        await new Promise(resolve => setTimeout(resolve, replicationDelayMs));

        // Verify that the value can be read
        const getResponse = await client.get(
          integrationTestCacheName,
          cacheKey
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(CacheGet.Hit);
        }, `expected HIT but got ${getResponse.toString()}`);

        expectWithMessage(() => {
          expect(getResponse.value()).toEqual(cacheValue);
        }, `expected ${cacheValue} but got ${getResponse.value() ?? 'undefined'}`);
      };

      for (let i = 0; i < numTrials; i++) {
        trials.push(trialFn(i));
      }

      await Promise.all(trials);
    });
  });
}
