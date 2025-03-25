import {
  createStoreIfNotExists,
  deleteStoreIfExists,
  testCacheName,
  testStoreName,
} from '@gomomento/common-integration-tests';
import {
  AuthClient,
  CacheClient,
  CollectionTtl,
  Configuration,
  Configurations,
  CreateCache,
  CredentialProvider,
  DeleteCache,
  LeaderboardConfigurations,
  MomentoErrorCode,
  MomentoLocalProvider,
  PreviewLeaderboardClient,
  PreviewStorageClient,
  ReadConcern,
  StorageConfigurations,
  TopicClient,
  TopicConfiguration,
  TopicConfigurations,
} from '../../src';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/clients/ICacheClient';
import {ITopicClient} from '@gomomento/sdk-core/dist/src/clients/ITopicClient';
import {CacheClientAllProps} from '../../src/internal/cache-client-all-props';
import {
  MomentoLocalMiddleware,
  MomentoLocalMiddlewareArgs,
} from '../momento-local-middleware';
import {MomentoLocalProviderProps} from '@gomomento/sdk-core/dist/src/auth';

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

export async function WithCacheAndCacheClient(
  configFn: (config: Configuration) => Configuration,
  momentoLocalMiddlewareArgs: MomentoLocalMiddlewareArgs,
  testCallback: (cacheClient: CacheClient, cacheName: string) => Promise<void>
) {
  const cacheName = testCacheName();
  const momentoLocalProviderProps: MomentoLocalProviderProps = {
    hostname: process.env.MOMENTO_HOSTNAME || '127.0.0.1',
    port: parseInt(process.env.MOMENTO_PORT || '8080'),
  };
  const momentoLocalProvider = new MomentoLocalProvider(
    momentoLocalProviderProps
  );
  const testMiddleware = new MomentoLocalMiddleware(momentoLocalMiddlewareArgs);
  const cacheClient = await CacheClient.create({
    configuration: configFn(
      Configurations.Laptop.v1().withMiddlewares([testMiddleware])
    ),
    credentialProvider: momentoLocalProvider,
    defaultTtlSeconds: 60,
  });
  await cacheClient.createCache(cacheName);
  await testCallback(cacheClient, cacheName);
}

export async function WithCacheAndTopicClient(
  configFn: (config: TopicConfiguration) => TopicConfiguration,
  momentoLocalMiddlewareArgs: MomentoLocalMiddlewareArgs,
  testCallback: (topicClient: TopicClient, cacheName: string) => Promise<void>
) {
  const cacheName = testCacheName();
  const momentoLocalProviderProps: MomentoLocalProviderProps = {
    hostname: process.env.MOMENTO_HOSTNAME || '127.0.0.1',
    port: parseInt(process.env.MOMENTO_PORT || '8080'),
  };
  const momentoLocalProvider = new MomentoLocalProvider(
    momentoLocalProviderProps
  );
  const testMiddleware = new MomentoLocalMiddleware(momentoLocalMiddlewareArgs);
  const cacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: momentoLocalProvider,
    defaultTtlSeconds: 60,
  });
  const topicClient = new TopicClient({
    configuration: configFn(
      TopicConfigurations.Default.latest().withMiddlewares([testMiddleware])
    ),
    credentialProvider: momentoLocalProvider,
  });
  await cacheClient.createCache(cacheName);
  await testCallback(topicClient, cacheName);
}

export class TestAdminClient {
  private readonly endpoint: string;

  constructor() {
    const host = process.env.TEST_ADMIN_ENDPOINT || '127.0.0.1';
    const port = process.env.TEST_ADMIN_PORT || '9090';
    this.endpoint = `${host}:${port}`;
  }

  public async blockPort(): Promise<void> {
    await this.sendRequest('/block', 'Failed to block port');
  }

  public async unblockPort(): Promise<void> {
    await this.sendRequest('/unblock', 'Failed to unblock port');
  }

  private async sendRequest(path: string, errorMessage: string): Promise<void> {
    try {
      await fetch(`http://${this.endpoint}${path}`);
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      throw error;
    }
  }
}

let _credsProvider: CredentialProvider | undefined = undefined;
export function credsProvider(): CredentialProvider {
  if (_credsProvider === undefined) {
    _credsProvider =
      CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY');
  }
  return _credsProvider;
}

let _mgaAccountSessionTokenCredsProvider: CredentialProvider | undefined =
  undefined;

function mgaAccountSessionTokenCredsProvider(): CredentialProvider {
  if (_mgaAccountSessionTokenCredsProvider === undefined) {
    _mgaAccountSessionTokenCredsProvider =
      CredentialProvider.fromEnvironmentVariable({
        environmentVariableName: 'TEST_MGA_ACCOUNT_SESSION_TOKEN',
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
  return _mgaAccountSessionTokenCredsProvider;
}

function testAgainstMomentoLocal(): boolean {
  return process.env.MOMENTO_LOCAL !== undefined;
}

function useConsistentReads(): boolean {
  return process.argv.find(arg => arg === 'useConsistentReads') !== undefined;
}

export function integrationTestCacheClientProps(): CacheClientAllProps {
  let credentialProvider = credsProvider();
  if (testAgainstMomentoLocal()) {
    credentialProvider = new MomentoLocalProvider();
  }

  const readConcern = useConsistentReads()
    ? ReadConcern.CONSISTENT
    : ReadConcern.BALANCED;

  return {
    configuration: Configurations.Laptop.latest()
      .withClientTimeoutMillis(90000)
      .withReadConcern(readConcern),
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

function momentoCacheClientForTestingWithMgaAccountSessionToken(): CacheClient {
  return new CacheClient({
    configuration:
      Configurations.Laptop.latest().withClientTimeoutMillis(90000),
    credentialProvider: mgaAccountSessionTokenCredsProvider(),
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

function momentoTopicClientForTestingWithMgaAccountSessionToken(): TopicClient {
  return new TopicClient({
    configuration: integrationTestCacheClientProps().configuration,
    credentialProvider: mgaAccountSessionTokenCredsProvider(),
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
  credentialProvider: CredentialProvider;
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
    credentialProvider: credsProvider(),
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
  const integrationTestStoreName = testStoreName();
  const storageClient = momentoStorageClientForTesting();

  beforeAll(async () => {
    await createStoreIfNotExists(storageClient, integrationTestStoreName);
  });

  afterAll(async () => {
    await deleteStoreIfExists(storageClient, integrationTestStoreName);
  });

  return {
    storageClient,
    integrationTestStoreName,
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
