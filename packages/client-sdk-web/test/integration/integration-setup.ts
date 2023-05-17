import {AuthClient, CacheClient, TopicClient} from '../../src';
import {
  deleteCacheIfExists,
  testCacheName,
} from '@gomomento/common-integration-tests';
import {
  CreateCache,
  CredentialProvider,
  DeleteCache,
  NoopMomentoLoggerFactory,
} from '@gomomento/sdk-core';
import {ITopicClient} from '@gomomento/sdk-core/dist/src/internal/clients';

const credsProvider = CredentialProvider.fromEnvironmentVariable({
  environmentVariableName: 'TEST_AUTH_TOKEN',
});

function momentoClientForTesting() {
  return new CacheClient({
    credentialProvider: credsProvider,
  });
}

function momentoTopicClientForTesting(): ITopicClient {
  return new TopicClient({
    configuration: {
      getLoggerFactory: () => new NoopMomentoLoggerFactory(),
    },
    credentialProvider: credsProvider,
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

export function SetupTopicIntegrationTest(): {
  topicClient: ITopicClient;
  Momento: CacheClient;
  IntegrationTestCacheName: string;
} {
  const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();
  const topicClient = momentoTopicClientForTesting();
  return {topicClient, Momento, IntegrationTestCacheName};
}

export function SetupAuthClientIntegrationTest(): {
  sessionTokenAuthClient: AuthClient;
  authTokenAuthClientFactory: (authToken: string) => AuthClient;
} {
  return {
    sessionTokenAuthClient: new AuthClient({
      credentialProvider: CredentialProvider.fromEnvironmentVariable({
        environmentVariableName: 'TEST_SESSION_TOKEN',
        // session tokens don't include cache/control endpoints, so we must provide them.  In this case we just hackily
        // steal them from the auth-token-based creds provider.
        cacheEndpoint: credsProvider.getCacheEndpoint(),
        controlEndpoint: credsProvider.getControlEndpoint(),
      }),
    }),
    authTokenAuthClientFactory: authToken =>
      new AuthClient({
        credentialProvider: CredentialProvider.fromString({
          authToken: authToken,
        }),
      }),
  };
}
