import {testCacheName} from '@gomomento/common-integration-tests';
import {
  AuthClient,
  CreateCache,
  Configurations,
  DeleteCache,
  MomentoErrorCode,
  CacheClient,
  CredentialProvider,
  CollectionTtl,
  TopicClient,
  PreviewLeaderboardClient,
  LeaderboardConfigurations,
  PreviewStorageClient,
  StorageConfigurations,
} from '../../src';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/clients/ICacheClient';
import {ITopicClient} from '@gomomento/sdk-core/dist/src/clients/ITopicClient';
import {CacheClientPropsWithConfig} from '../../src/internal/cache-client-props-with-config';
import {ReadConcern} from '@gomomento/sdk-core';

export const deleteCacheIfExists = async (
  momento: CacheClient,
  cacheName: string
) => {
  const deleteResponse = await momento.deleteCache(cacheName);
  if (deleteResponse instanceof DeleteCache.Error) {
    if (deleteResponse.errorCode() !== MomentoErrorCode.CACHE_NOT_FOUND_ERROR) {
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

let _credsProvider: CredentialProvider | undefined = undefined;
export function credsProvider(): CredentialProvider {
  if (_credsProvider === undefined) {
    _credsProvider = CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY');
  }
  return _credsProvider;
}

let _sessionCredsProvider: CredentialProvider | undefined = undefined;

function sessionCredsProvider(): CredentialProvider {
  if (_sessionCredsProvider === undefined) {
    _sessionCredsProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'TEST_SESSION_TOKEN',
      // session tokens don't include cache/control endpoints, so we must provide them.  In this case we just hackily
      // steal them from the auth-token-based creds provider.
      endpointOverrides: {
        cacheEndpoint: {
          endpoint: credsProvider().getCacheEndpoint(),
          secureConnection: credsProvider().isCacheEndpointSecure(),
        },
        controlEndpoint: {
          endpoint: credsProvider().getControlEndpoint(),
          secureConnection: credsProvider().isControlEndpointSecure(),
        },
        tokenEndpoint: {
          endpoint: credsProvider().getTokenEndpoint(),
          secureConnection: credsProvider().isTokenEndpointSecure(),
        },
        storageEndpoint: {
          endpoint: credsProvider().getStorageEndpoint(),
          secureConnection: credsProvider().isStorageEndpointSecure(),
        },
      },
    });
  }
  return _sessionCredsProvider;
}

function testAgainstMomentoLocal(): boolean {
  return process.env.MOMENTO_LOCAL !== undefined;
}

export function integrationTestCacheClientProps(): CacheClientPropsWithConfig {
  let credentialProvider = credsProvider();
  if (testAgainstMomentoLocal()) {
    credentialProvider = credentialProvider.withMomentoLocal();
  }

  return {
    configuration:
      Configurations.Laptop.latest().withClientTimeoutMillis(90000),
    credentialProvider,
    defaultTtlSeconds: 1111,
  };
}

function momentoClientForTesting(): CacheClient {
  return new CacheClient(integrationTestCacheClientProps());
}

function momentoClientForTestingWithThrowOnErrors(): CacheClient {
  const props = integrationTestCacheClientProps();
  props.configuration = props.configuration.withThrowOnErrors(true);
  return new CacheClient(props);
}

function momentoClientForTestingBalancedReadConcern(): CacheClient {
  const props = integrationTestCacheClientProps();
  props.configuration = props.configuration.withReadConcern(
    ReadConcern.BALANCED
  );
  return new CacheClient(props);
}

function momentoClientForTestingConsistentReadConcern(): CacheClient {
  const props = integrationTestCacheClientProps();
  props.configuration = props.configuration.withReadConcern(
    ReadConcern.CONSISTENT
  );
  return new CacheClient(props);
}

function momentoClientForTestingWithSessionToken(): CacheClient {
  return new CacheClient({
    configuration:
      Configurations.Laptop.latest().withClientTimeoutMillis(90000),
    credentialProvider: sessionCredsProvider(),
    defaultTtlSeconds: 1111,
  });
}

function momentoTopicClientForTesting(): TopicClient {
  return new TopicClient({
    configuration: integrationTestCacheClientProps().configuration,
    credentialProvider: integrationTestCacheClientProps().credentialProvider,
  });
}

function momentoStorageClientForTesting(): PreviewStorageClient {
  return new PreviewStorageClient({
    configuration: StorageConfigurations.Laptop.latest(),
    credentialProvider: integrationTestCacheClientProps().credentialProvider,
  });
}

function momentoTopicClientWithThrowOnErrorsForTesting(): TopicClient {
  return new TopicClient({
    configuration:
      integrationTestCacheClientProps().configuration.withThrowOnErrors(true),
    credentialProvider: integrationTestCacheClientProps().credentialProvider,
  });
}

function momentoTopicClientForTestingWithSessionToken(): TopicClient {
  return new TopicClient({
    configuration: integrationTestCacheClientProps().configuration,
    credentialProvider: sessionCredsProvider(),
  });
}

function momentoLeaderboardClientForTesting(): PreviewLeaderboardClient {
  return new PreviewLeaderboardClient({
    credentialProvider: credsProvider(),
    configuration: LeaderboardConfigurations.Laptop.latest(),
  });
}

function momentoLeaderboardClientWithThrowOnErrorsForTesting(): PreviewLeaderboardClient {
  return new PreviewLeaderboardClient({
    credentialProvider: credsProvider(),
    configuration:
      LeaderboardConfigurations.Laptop.latest().withThrowOnErrors(true),
  });
}

export function SetupIntegrationTest(): {
  cacheClient: CacheClient;
  cacheClientWithThrowOnErrors: CacheClient;
  cacheClientWithBalancedReadConcern: CacheClient;
  cacheClientWithConsistentReadConcern: CacheClient;
  integrationTestCacheName: string;
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
  const clientWithThrowOnErrors = momentoClientForTestingWithThrowOnErrors();
  const clientWithBalancedReadConcern =
    momentoClientForTestingBalancedReadConcern();
  const clientWithConsistentReadConcern =
    momentoClientForTestingConsistentReadConcern();
  return {
    cacheClient: client,
    cacheClientWithThrowOnErrors: clientWithThrowOnErrors,
    cacheClientWithBalancedReadConcern: clientWithBalancedReadConcern,
    cacheClientWithConsistentReadConcern: clientWithConsistentReadConcern,
    integrationTestCacheName: cacheName,
  };
}

export function SetupTopicIntegrationTest(): {
  topicClient: TopicClient;
  topicClientWithThrowOnErrors: TopicClient;
  cacheClient: CacheClient;
  integrationTestCacheName: string;
} {
  const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();
  const topicClient = momentoTopicClientForTesting();
  const topicClientWithThrowOnErrors =
    momentoTopicClientWithThrowOnErrorsForTesting();
  return {
    topicClient,
    topicClientWithThrowOnErrors,
    cacheClient: cacheClient,
    integrationTestCacheName: integrationTestCacheName,
  };
}

export function SetupStorageIntegrationTest(): {
  storageClient: PreviewStorageClient;
  integrationTestStoreName: string;
} {
  const {integrationTestCacheName} = SetupIntegrationTest();
  const storageClient = momentoStorageClientForTesting();
  return {
    storageClient,
    integrationTestStoreName: integrationTestCacheName,
  };
}

export function SetupLeaderboardIntegrationTest(): {
  leaderboardClient: PreviewLeaderboardClient;
  leaderboardClientWithThrowOnErrors: PreviewLeaderboardClient;
  integrationTestCacheName: string;
} {
  const {integrationTestCacheName} = SetupIntegrationTest();
  const leaderboardClient = momentoLeaderboardClientForTesting();
  const leaderboardClientWithThrowOnErrors =
    momentoLeaderboardClientWithThrowOnErrorsForTesting();
  return {
    leaderboardClient,
    leaderboardClientWithThrowOnErrors,
    integrationTestCacheName: integrationTestCacheName,
  };
}

export function SetupAuthClientIntegrationTest(): {
  sessionTokenAuthClient: AuthClient;
  legacyTokenAuthClient: AuthClient;
  sessionTokenCacheClient: CacheClient;
  sessionTokenTopicClient: TopicClient;
  authTokenAuthClientFactory: (authToken: string) => AuthClient;
  cacheClientFactory: (token: string) => ICacheClient;
  topicClientFactory: (token: string) => ITopicClient;
  cacheName: string;
} {
  const cacheName = testCacheName();

  beforeAll(async () => {
    // Use a fresh client to avoid test interference with setup.
    const momento = momentoClientForTestingWithSessionToken();
    await deleteCacheIfExists(momento, cacheName);
    const createResponse = await momento.createCache(cacheName);
    if (createResponse instanceof CreateCache.Error) {
      throw createResponse.innerException();
    }
  });

  afterAll(async () => {
    // Use a fresh client to avoid test interference with teardown.
    const momento = momentoClientForTestingWithSessionToken();
    const deleteResponse = await momento.deleteCache(cacheName);
    if (deleteResponse instanceof DeleteCache.Error) {
      throw deleteResponse.innerException();
    }
  });

  return {
    sessionTokenAuthClient: new AuthClient({
      credentialProvider: sessionCredsProvider(),
    }),
    legacyTokenAuthClient: new AuthClient({
      credentialProvider: CredentialProvider.fromEnvironmentVariable({
        environmentVariableName: 'TEST_LEGACY_AUTH_TOKEN',
      }),
    }),
    sessionTokenCacheClient: momentoClientForTestingWithSessionToken(),
    sessionTokenTopicClient: momentoTopicClientForTestingWithSessionToken(),
    authTokenAuthClientFactory: authToken => {
      return new AuthClient({
        credentialProvider: CredentialProvider.fromString({
          authToken: authToken,
        }),
      });
    },
    cacheClientFactory: authToken =>
      new CacheClient({
        credentialProvider: CredentialProvider.fromString({
          authToken: authToken,
        }),
        configuration: Configurations.Laptop.latest(),
        defaultTtlSeconds: 60,
      }),
    topicClientFactory: authToken =>
      new TopicClient({
        credentialProvider: CredentialProvider.fromString({
          authToken: authToken,
        }),
        configuration: Configurations.Laptop.latest(),
      }),
    cacheName: cacheName,
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
