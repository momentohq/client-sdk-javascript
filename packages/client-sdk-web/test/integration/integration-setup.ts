import {CacheClient} from '../../src/cache-client';
import {
  deleteCacheIfExists,
  testCacheName,
} from '@gomomento/common-integration-tests';
import {CreateCache, CredentialProvider, DeleteCache} from '@gomomento/common';

function momentoClientForTesting() {
  return new CacheClient({
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'TEST_AUTH_TOKEN',
    }),
  });
}

export function SetupIntegrationTest(): {
  Momento: CacheClient;
  IntegrationTestCacheName: string;
} {
  const cacheName = testCacheName();

  beforeAll(async () => {
    // Use a fresh client to avoid test interference with setup.
    const momento = momentoClientForTesting();
    await deleteCacheIfExists(momento, cacheName);
    const createResponse = await momento.createCache(cacheName);
    if (createResponse instanceof CreateCache.Error) {
      throw createResponse.innerException();
    }
  });

  afterAll(async () => {
    // Use a fresh client to avoid test interference with teardown.
    const momento = momentoClientForTesting();
    const deleteResponse = await momento.deleteCache(cacheName);
    if (deleteResponse instanceof DeleteCache.Error) {
      throw deleteResponse.innerException();
    }
  });

  const client = momentoClientForTesting();
  return {Momento: client, IntegrationTestCacheName: cacheName};
}
