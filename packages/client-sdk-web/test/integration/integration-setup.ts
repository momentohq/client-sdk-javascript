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
} from '@gomomento/sdk-core';
import {CacheClientProps} from '../../src/cache-client-props';
import {
  CacheClient,
  TopicClient,
  PreviewVectorClient,
  Configurations,
  AuthClient,
  TopicConfigurations,
  VectorConfigurations,
} from '../../src';
import {ITopicClient} from '@gomomento/sdk-core/dist/src/clients/ITopicClient';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/clients/ICacheClient';

let _credsProvider: CredentialProvider | undefined = undefined;
let _sessionCredsProvider: CredentialProvider | undefined = undefined;

function credsProvider(): CredentialProvider {
  if (_credsProvider === undefined) {
    if (isLocalhostDevelopmentMode()) {
      _credsProvider = CredentialProvider.fromEnvironmentVariable({
        environmentVariableName: 'TEST_AUTH_TOKEN',
        controlEndpoint: 'https://no-controlplane-requests-allowed:9001',
        cacheEndpoint: 'https://localhost:9001',
      });
    } else {
      _credsProvider = CredentialProvider.fromEnvironmentVariable({
        environmentVariableName: 'TEST_AUTH_TOKEN',
      });
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
      cacheEndpoint: credsProvider().getCacheEndpoint(),
      controlEndpoint: credsProvider().getControlEndpoint(),
    });
  }
  return _sessionCredsProvider;
}

export const IntegrationTestCacheClientProps: CacheClientProps = {
  configuration: Configurations.Laptop.latest(),
  credentialProvider: credsProvider(),
  defaultTtlSeconds: 1111,
};

function momentoClientForTesting(): CacheClient {
  return new CacheClient(IntegrationTestCacheClientProps);
}

function momentoClientForTestingWithSessionToken(): CacheClient {
  return new CacheClient({
    configuration: Configurations.Laptop.latest(),
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

function momentoTopicClientForTestingWithSessionToken(): TopicClient {
  return new TopicClient({
    configuration: IntegrationTestCacheClientProps.configuration,
    credentialProvider: sessionCredsProvider(),
  });
}

function momentoVectorClientForTesting(): PreviewVectorClient {
  return new PreviewVectorClient({
    configuration: VectorConfigurations.Laptop.latest(),
    credentialProvider: credsProvider(),
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
  return {Momento: client, IntegrationTestCacheName: cacheName};
}

export function SetupTopicIntegrationTest(): {
  topicClient: ITopicClient;
  Momento: CacheClient;
  IntegrationTestCacheName: string;
} {
  const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();
  const topicClient = momentoTopicClientForTesting();
  return {topicClient, Momento, IntegrationTestCacheName};
}

export function SetupVectorIntegrationTest(): {
  Momento: PreviewVectorClient;
} {
  const Momento = momentoVectorClientForTesting();
  return {Momento};
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
