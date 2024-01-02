import {CacheClientProps} from '../../src/cache-client-props';
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
  PreviewVectorIndexClient,
  VectorIndexConfigurations,
  PreviewLeaderboardClient,
  LeaderboardConfigurations,
} from '../../src';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/clients/ICacheClient';
import {ITopicClient} from '@gomomento/sdk-core/dist/src/clients/ITopicClient';

export const deleteCacheIfExists = async (
  momento: CacheClient,
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
function credsProvider(): CredentialProvider {
  if (_credsProvider === undefined) {
    _credsProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'TEST_AUTH_TOKEN',
    });
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
        cacheEndpoint: credsProvider().getCacheEndpoint(),
        controlEndpoint: credsProvider().getControlEndpoint(),
        tokenEndpoint: credsProvider().getTokenEndpoint(),
        vectorEndpoint: credsProvider().getVectorEndpoint(),
      },
    });
  }
  return _sessionCredsProvider;
}

export function integrationTestCacheClientProps(): CacheClientProps {
  return {
    configuration:
      Configurations.Laptop.latest().withClientTimeoutMillis(60000),
    credentialProvider: credsProvider(),
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

function momentoClientForTestingWithSessionToken(): CacheClient {
  return new CacheClient({
    configuration:
      Configurations.Laptop.latest().withClientTimeoutMillis(60000),
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

function momentoTopicClientForTestingWithSessionToken(): TopicClient {
  return new TopicClient({
    configuration: integrationTestCacheClientProps().configuration,
    credentialProvider: sessionCredsProvider(),
  });
}

function momentoVectorClientForTesting(): PreviewVectorIndexClient {
  return new PreviewVectorIndexClient({
    credentialProvider: credsProvider(),
    configuration: VectorIndexConfigurations.Laptop.latest(),
  });
}

function momentoLeaderboardClientForTesting(): PreviewLeaderboardClient {
  return new PreviewLeaderboardClient({
    credentialProvider: credsProvider(),
    configuration: LeaderboardConfigurations.Laptop.latest(),
  });
}

export function SetupIntegrationTest(): {
  cacheClient: CacheClient;
  cacheClientWithThrowOnErrors: CacheClient;
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
  return {
    cacheClient: client,
    cacheClientWithThrowOnErrors: clientWithThrowOnErrors,
    integrationTestCacheName: cacheName,
  };
}

export function SetupTopicIntegrationTest(): {
  topicClient: TopicClient;
  cacheClient: CacheClient;
  integrationTestCacheName: string;
} {
  const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();
  const topicClient = momentoTopicClientForTesting();
  return {
    topicClient,
    cacheClient: cacheClient,
    integrationTestCacheName: integrationTestCacheName,
  };
}

export function SetupVectorIntegrationTest(): {
  vectorClient: PreviewVectorIndexClient;
} {
  const vectorClient = momentoVectorClientForTesting();
  return {vectorClient};
}

export function SetupLeaderboardIntegrationTest(): {
  leaderboardClient: PreviewLeaderboardClient;
  integrationTestCacheName: string;
} {
  const {integrationTestCacheName} = SetupIntegrationTest();
  const leaderboardClient = momentoLeaderboardClientForTesting();
  return {
    leaderboardClient,
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
