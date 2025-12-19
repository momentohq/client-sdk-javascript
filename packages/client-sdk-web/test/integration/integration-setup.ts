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
} from '@gomomento/sdk-core';
import {
  CacheClient,
  TopicClient,
  Configurations,
  AuthClient,
  TopicConfigurations,
  PreviewLeaderboardClient,
  LeaderboardConfigurations,
} from '../../src';
import {ITopicClient} from '@gomomento/sdk-core/dist/src/clients/ITopicClient';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/clients/ICacheClient';
import {CacheClientAllProps} from '../../src/internal/cache-client-all-props';

let _credsProvider: CredentialProvider | undefined = undefined;
let _mgaAccountSessionTokenCredsProvider: CredentialProvider | undefined =
  undefined;

export function credsProvider(): CredentialProvider {
  if (_credsProvider === undefined) {
    if (isLocalhostDevelopmentMode()) {
      _credsProvider = CredentialProvider.fromEnvironmentVariable({
        environmentVariableName: 'V1_API_KEY',
        endpointOverrides: {
          controlEndpoint: 'https://no-controlplane-requests-allowed:9001',
          cacheEndpoint: 'https://localhost:9001',
          tokenEndpoint: 'https://localhost:9001',
        },
      });
    } else {
      _credsProvider = CredentialProvider.fromEnvironmentVariable('V1_API_KEY');
    }
  }
  return _credsProvider;
}

let _credsProviderV2: CredentialProvider | undefined = undefined;
export function credsProviderV2(): CredentialProvider {
  if (_credsProviderV2 === undefined) {
    // Looks for MOMENTO_API_KEY and MOMENTO_ENDPOINT environment variables
    _credsProviderV2 = CredentialProvider.fromEnvVarV2();
  }
  return _credsProviderV2;
}

function mgaAccountSessionTokenCredsProvider(): CredentialProvider {
  if (_mgaAccountSessionTokenCredsProvider === undefined) {
    _mgaAccountSessionTokenCredsProvider =
      CredentialProvider.fromEnvironmentVariable({
        environmentVariableName: 'TEST_MGA_ACCOUNT_SESSION_TOKEN',
        // session tokens don't include cache/control endpoints, so we must provide them.  In this case we just hackily
        // steal them from the auth-token-based creds provider.
        endpointOverrides: {
          cacheEndpoint: credsProvider().getCacheEndpoint(),
          controlEndpoint: credsProvider().getControlEndpoint(),
          tokenEndpoint: credsProvider().getTokenEndpoint(),
          secureConnection: credsProvider().isEndpointSecure(),
        },
      });
  }
  return _mgaAccountSessionTokenCredsProvider;
}

function useConsistentReads(): boolean {
  return process.argv.find(arg => arg === 'useConsistentReads') !== undefined;
}

function integrationTestCacheClientProps(
  apiKeyV2 = false
): CacheClientAllProps {
  const readConcern = useConsistentReads()
    ? ReadConcern.CONSISTENT
    : ReadConcern.BALANCED;

  return {
    configuration: Configurations.Laptop.latest()
      .withClientTimeoutMillis(90000)
      .withReadConcern(readConcern),
    credentialProvider: apiKeyV2 ? credsProviderV2() : credsProvider(),
    defaultTtlSeconds: 1111,
  };
}

function momentoClientForTesting(apiKeyV2 = false): CacheClient {
  return new CacheClient(integrationTestCacheClientProps(apiKeyV2));
}

function momentoClientWithThrowOnErrorsForTesting(): CacheClient {
  const props: CacheClientAllProps = integrationTestCacheClientProps();
  props.configuration = props.configuration.withThrowOnErrors(true);
  return new CacheClient(props);
}

function momentoCacheClientForTestingWithMgaAccountSessionToken(): CacheClient {
  return new CacheClient({
    configuration:
      Configurations.Laptop.latest().withClientTimeoutMillis(90000),
    credentialProvider: mgaAccountSessionTokenCredsProvider(),
    defaultTtlSeconds: 1111,
  });
}

function momentoTopicClientForTesting(apiKeyV2 = false): TopicClient {
  return new TopicClient({
    configuration: TopicConfigurations.Default.latest(),
    credentialProvider: apiKeyV2 ? credsProviderV2() : credsProvider(),
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

function momentoTopicClientForTestingWithMgaAccountSessionToken(): TopicClient {
  return new TopicClient({
    configuration: integrationTestCacheClientProps().configuration,
    credentialProvider: mgaAccountSessionTokenCredsProvider(),
  });
}

function momentoLeaderboardClientForTesting(
  apiKeyV2 = false
): PreviewLeaderboardClient {
  return new PreviewLeaderboardClient({
    credentialProvider: apiKeyV2 ? credsProviderV2() : credsProvider(),
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
  cacheClientApiKeyV2: CacheClient;
  integrationTestCacheName: string;
  credentialProvider: CredentialProvider;
  credentialProviderV2: CredentialProvider;
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

  const cacheClient = momentoClientForTesting();
  const cacheClientWithThrowOnErrors =
    momentoClientWithThrowOnErrorsForTesting();
  const cacheClientWithBalancedReadConcern =
    momentoClientForTestingBalancedReadConcern();
  const cacheClientWithConsistentReadConcern =
    momentoClientForTestingConsistentReadConcern();
  const cacheClientApiKeyV2 = momentoClientForTesting(true);
  return {
    cacheClient,
    cacheClientWithThrowOnErrors,
    cacheClientWithBalancedReadConcern,
    cacheClientWithConsistentReadConcern,
    cacheClientApiKeyV2,
    integrationTestCacheName: cacheName,
    credentialProvider: credsProvider(),
    credentialProviderV2: credsProviderV2(),
  };
}

export function SetupTopicIntegrationTest(): {
  topicClient: ITopicClient;
  topicClientApiKeyV2: TopicClient;
  topicClientWithThrowOnErrors: ITopicClient;
  cacheClient: CacheClient;
  integrationTestCacheName: string;
} {
  const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();
  const topicClient = momentoTopicClientForTesting();
  const topicClientApiKeyV2 = momentoTopicClientForTesting(true);
  const topicClientWithThrowOnErrors =
    momentoTopicClientWithThrowOnErrorsForTesting();
  return {
    topicClient,
    topicClientApiKeyV2,
    topicClientWithThrowOnErrors,
    cacheClient: cacheClient,
    integrationTestCacheName: integrationTestCacheName,
  };
}

export function SetupLeaderboardIntegrationTest(): {
  leaderboardClient: PreviewLeaderboardClient;
  leaderboardClientApiKeyV2: PreviewLeaderboardClient;
  leaderboardClientWithThrowOnErrors: PreviewLeaderboardClient;
  integrationTestCacheName: string;
} {
  const {integrationTestCacheName} = SetupIntegrationTest();
  const leaderboardClient = momentoLeaderboardClientForTesting();
  const leaderboardClientWithThrowOnErrors =
    momentoLeaderboardClientWithThrowOnErrorsForTesting();
  const leaderboardClientApiKeyV2 = momentoLeaderboardClientForTesting(true);
  return {
    leaderboardClient,
    leaderboardClientApiKeyV2,
    leaderboardClientWithThrowOnErrors,
    integrationTestCacheName: integrationTestCacheName,
  };
}

export function SetupAuthClientIntegrationTest(): {
  mgaAccountSessionTokenAuthClient: AuthClient;
  legacyTokenAuthClient: AuthClient;
  mgaAccountSessionTokenCacheClient: CacheClient;
  mgaAccountSessionTokenTopicClient: TopicClient;
  authTokenAuthClientFactory: (authToken: string) => AuthClient;
  cacheClientFactory: (token: string) => ICacheClient;
  topicClientFactory: (token: string) => ITopicClient;
  cacheName: string;
} {
  const cacheName = testCacheName();

  beforeAll(async () => {
    // Use a fresh client to avoid test interference with setup.
    const momento = momentoCacheClientForTestingWithMgaAccountSessionToken();
    await deleteCacheIfExists(momento, cacheName);
    const createResponse = await momento.createCache(cacheName);
    if (createResponse instanceof CreateCache.Error) {
      throw createResponse.innerException();
    }
  });

  afterAll(async () => {
    // Use a fresh client to avoid test interference with teardown.
    const momento = momentoCacheClientForTestingWithMgaAccountSessionToken();
    const deleteResponse = await momento.deleteCache(cacheName);
    if (deleteResponse instanceof DeleteCache.Error) {
      throw deleteResponse.innerException();
    }
  });

  return {
    mgaAccountSessionTokenAuthClient: new AuthClient({
      credentialProvider: mgaAccountSessionTokenCredsProvider(),
    }),
    legacyTokenAuthClient: new AuthClient({
      credentialProvider: CredentialProvider.fromEnvironmentVariable({
        environmentVariableName: 'TEST_LEGACY_AUTH_TOKEN',
      }),
    }),
    mgaAccountSessionTokenCacheClient:
      momentoCacheClientForTestingWithMgaAccountSessionToken(),
    mgaAccountSessionTokenTopicClient:
      momentoTopicClientForTestingWithMgaAccountSessionToken(),
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
