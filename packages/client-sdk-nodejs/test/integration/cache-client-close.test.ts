import {expectWithMessage} from '@gomomento/common-integration-tests';

import {GetBatch} from '@gomomento/sdk-core';
import {SetupIntegrationTestWithMiddleware} from './integration-setup';

const {cacheClient, cacheName} = SetupIntegrationTestWithMiddleware();

describe("Test exercises closing a client and jest doesn't hang", () => {
  it('getBatch happy path with all misses', async () => {
    const keys = ['a', 'b', 'c', '1', '2', '3'];
    const response = await cacheClient.getBatch(cacheName, keys);

    // Check get batch response
    expectWithMessage(() => {
      expect(response).toBeInstanceOf(GetBatch.Success);
    }, `expected SUCCESS for keys ${keys.toString()}, received ${response.toString()}`);
  });
});
