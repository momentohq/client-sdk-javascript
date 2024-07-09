import {
  deleteCacheIfExists,
  testCacheName,
  isLocalhostDevelopmentMode,
  createCacheIfNotExists,
} from '@gomomento/common-integration-tests';
import {
  CreateCache,
  DeleteCache,
  CredentialProvider,
  ReadConcern,
  IStorageClient,
} from '@gomomento/sdk-core';
import {
  CacheClient,
  TopicClient,
  Configurations,
  AuthClient,
  TopicConfigurations,
  PreviewLeaderboardClient,
  LeaderboardConfigurations,
  StorageConfigurations,
  PreviewStorageClient,
} from '../../src';
import {ITopicClient} from '@gomomento/sdk-core/dist/src/clients/ITopicClient';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/clients/ICacheClient';
import {CacheClientPropsWithConfig} from '../../src/internal/cache-client-props-with-config';

let _credsProvider: CredentialProvider | undefined = undefined;
let _sessionCredsProvider: CredentialProvider | undefined = undefined;

export function credsProvider(): CredentialProvider {
  if (_credsProvider === undefined) {
    if (isLocalhostDevelopmentMode()) {
      _credsProvider = CredentialProvider.fromEnvironmentVariable({
        environmentVariableName: 'MOMENTO_API_KEY',
        endpointOverrides: {
          controlEndpoint: {
            endpoint: 'https://no-controlplane-requests-allowed:9001',
          },
          cacheEndpoint: {
            endpoint: 'https://localhost:9001',
          },
          tokenEndpoint: {
            endpoint: 'https://localhost:9001',
          },
          storageEndpoint: {
            endpoint: 'https://localhost:9001',
          },
        },
      });
    } else {
      _credsProvider = CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY');
    }
  }
  return _credsProvider;
}

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

function integrationTestCacheClientProps(): CacheClientPropsWithConfig {
  return {
    configuration:
      Configurations.Laptop.latest().withClientTimeoutMillis(90000),
    credentialProvider: credsProvider(),
    defaultTtlSeconds: 1111,
  };
}

function momentoClientForTesting(): CacheClient {
  return new CacheClient(integrationTestCacheClientProps());
}

function momentoClientWithThrowOnErrorsForTesting(): CacheClient {
  const props: CacheClientPropsWithConfig = integrationTestCacheClientProps();
  props.configuration = props.configuration.withThrowOnErrors(true);
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
    configuration: TopicConfigurations.Default.latest(),
    credentialProvider: credsProvider(),
  });
}

function momentoStorageClientForTesting(): PreviewStorageClient {
  return new PreviewStorageClient({
    configuration: StorageConfigurations.Default.latest(),
    credentialProvider: credsProvider(),
  });
}

function momentoTopicClientWithThrowOnErrorsForTesting(): TopicClient {
  return new TopicClient({
    configuration: TopicConfigurations.Default.latest().withThrowOnErrors(true),
    credentialProvider: credsProvider(),
  });
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
    await createCacheIfNotExists(momento, cacheName);
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
  const clientWithThrowOnErrors = momentoClientWithThrowOnErrorsForTesting();
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
  topicClient: ITopicClient;
  topicClientWithThrowOnErrors: ITopicClient;
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
  storageClient: IStorageClient;
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
    authTokenAuthClientFactory: authToken =>
      new AuthClient({
        credentialProvider: CredentialProvider.fromString({
          authToken: authToken,
        }),
      }),
    cacheClientFactory: authToken =>
      new CacheClient({
        credentialProvider: CredentialProvider.fromString({
          authToken: authToken,
        }),
        configuration: Configurations.Laptop.v1(),
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
