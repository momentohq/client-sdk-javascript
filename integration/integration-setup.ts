import {SimpleCacheClientProps} from '../src/simple-cache-client-props';
import {
  CreateCache,
  Configurations,
  DeleteCache,
  EnvMomentoTokenProvider,
  MomentoErrorCode,
  SimpleCacheClient,
} from '../src';

export const INTEGRATION_TEST_CACHE_NAME =
  process.env.TEST_CACHE_NAME || 'js-integration-test-default';

const deleteCacheIfExists = async (
  momento: SimpleCacheClient,
  cacheName: string
) => {
  const deleteResponse = await momento.deleteCache(cacheName);
  if (deleteResponse instanceof DeleteCache.Error) {
    if (deleteResponse.errorCode() !== MomentoErrorCode.NOT_FOUND_ERROR) {
      throw deleteResponse.innerException();
    }
  }
};

export async function WithCache(
  client: SimpleCacheClient,
  cacheName: string,
  block: () => Promise<void>
) {
  await deleteCacheIfExists(client, cacheName);
  await client.createCache(cacheName);
  try {
    await block();
  } finally {
    await deleteCacheIfExists(client, cacheName);
  }
}

export const CacheClientProps: SimpleCacheClientProps = {
  configuration: Configurations.Laptop.latest(),
  credentialProvider: new EnvMomentoTokenProvider('TEST_AUTH_TOKEN'),
  defaultTtlSeconds: 1111,
};

function momentoClientForTesting() {
  return new SimpleCacheClient(CacheClientProps);
}

export function SetupIntegrationTest(): SimpleCacheClient {
  beforeAll(async () => {
    // Use a fresh client to avoid test interference with setup.
    const momento = momentoClientForTesting();
    await deleteCacheIfExists(momento, INTEGRATION_TEST_CACHE_NAME);
    const createResponse = await momento.createCache(
      INTEGRATION_TEST_CACHE_NAME
    );
    if (createResponse instanceof CreateCache.Error) {
      throw createResponse.innerException();
    }
  });

  afterAll(async () => {
    // Use a fresh client to avoid test interference with teardown.
    const momento = momentoClientForTesting();
    const deleteResponse = await momento.deleteCache(
      INTEGRATION_TEST_CACHE_NAME
    );
    if (deleteResponse instanceof DeleteCache.Error) {
      throw deleteResponse.innerException();
    }
  });

  return momentoClientForTesting();
}
