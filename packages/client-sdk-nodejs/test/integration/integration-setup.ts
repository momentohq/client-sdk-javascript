import {CacheClientProps} from '../../src/cache-client-props';
import {testCacheName} from '@gomomento/common-integration-tests';
import {
  CreateCache,
  Configurations,
  DeleteCache,
  MomentoErrorCode,
  CacheClient,
  CredentialProvider,
} from '../../src';
import {AuthClient} from '../../src/auth-client';
import {AuthClientProps} from '../../src/auth-client-props';

const deleteCacheIfExists = async (momento: CacheClient, cacheName: string) => {
  const deleteResponse = await momento.deleteCache(cacheName);
  if (deleteResponse instanceof DeleteCache.Error) {
    if (deleteResponse.errorCode() !== MomentoErrorCode.NOT_FOUND_ERROR) {
      throw deleteResponse.innerException();
    }
  }
};

export async function WithCache(
  client: CacheClient,
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

const credsProvider = CredentialProvider.fromEnvironmentVariable({
  environmentVariableName: 'TEST_AUTH_TOKEN',
});

export const IntegrationTestCacheClientProps: CacheClientProps = {
  configuration: Configurations.Laptop.latest(),
  credentialProvider: credsProvider,
  defaultTtlSeconds: 1111,
};

export const AuthIntegrationTestCacheClientProps: AuthClientProps = {
  configuration: Configurations.Laptop.latest(),
};

function momentoClientForTesting(): CacheClient {
  return new CacheClient(IntegrationTestCacheClientProps);
}

function momentoAuthClientForTesting(): AuthClient {
  return new AuthClient(AuthIntegrationTestCacheClientProps);
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

export function SetupAuthIntegrationTest(): {
  authClient: AuthClient;
  sessionToken: string;
  controlEndpoint: string;
} {
  const sessionToken = process.env.TEST_SESSION_TOKEN;
  if (sessionToken === undefined) {
    throw new Error('Missing required env var TEST_SESSION_TOKEN');
  }

  return {
    authClient: momentoAuthClientForTesting(),
    sessionToken: sessionToken,
    controlEndpoint: credsProvider.getControlEndpoint(),
  };
}

export interface ValidateCacheProps {
  cacheName: string;
}

export interface ValidateSortedSetProps extends ValidateCacheProps {
  sortedSetName: string;
  value: string | Uint8Array;
}

export interface ValidateSortedSetChangerProps extends ValidateSortedSetProps {
  score: number;
  ttl?: CollectionTtl;
}

export function delay(ms: number): Promise<unknown> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
