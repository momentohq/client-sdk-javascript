import {
  CacheClient,
  TopicClient,
  PreviewVectorIndexClient,
  PreviewLeaderboardClient,
  CredentialProvider,
} from '../../src';
import {credsProvider} from './integration-setup';

describe('default configurations', () => {
  it('CacheClient should be able to be constructed with a default configuration', async () => {
    const cacheClientViaConstructor = new CacheClient({
      credentialProvider: credsProvider(),
      defaultTtlSeconds: 60,
    });
    expect(cacheClientViaConstructor).toBeInstanceOf(CacheClient);

    const cacheClientViaFactory = await CacheClient.create({
      credentialProvider: credsProvider(),
      defaultTtlSeconds: 60,
    });
    expect(cacheClientViaFactory).toBeInstanceOf(CacheClient);
  });

  it('CacheClient should be able to be constructed with a simple string for env var', () => {
    const cacheClientViaConstructor = new CacheClient({
      credentialProvider:
        CredentialProvider.fromEnvironmentVariable('TEST_AUTH_TOKEN'),
      defaultTtlSeconds: 60,
    });
    expect(cacheClientViaConstructor).toBeInstanceOf(CacheClient);
  });

  it('CacheClient should be able to be constructed with a simple string for env var, using short function name', () => {
    const cacheClientViaConstructor = new CacheClient({
      credentialProvider: CredentialProvider.fromEnvVar('TEST_AUTH_TOKEN'),
      defaultTtlSeconds: 60,
    });
    expect(cacheClientViaConstructor).toBeInstanceOf(CacheClient);
  });

  it('CacheClient should be able to be constructed with a simple string for fromString', () => {
    const cacheClientViaConstructor = new CacheClient({
      credentialProvider: CredentialProvider.fromString(''),
      defaultTtlSeconds: 60,
    });
    expect(cacheClientViaConstructor).toBeInstanceOf(CacheClient);
  });

  it('TopicClient should be able to be constructed with a default configuration', () => {
    const topicClientViaConstructor = new TopicClient({
      credentialProvider: credsProvider(),
    });
    expect(topicClientViaConstructor).toBeInstanceOf(TopicClient);
  });

  it('VectorIndexClient should be able to be constructed with a default configuration', () => {
    const vectorIndexClientViaConstructor = new PreviewVectorIndexClient({
      credentialProvider: credsProvider(),
    });
    expect(vectorIndexClientViaConstructor).toBeInstanceOf(
      PreviewVectorIndexClient
    );
  });

  it('LeaderboardClient should be able to be constructed with a default configuration', () => {
    const leaderboardClientViaConstructor = new PreviewLeaderboardClient({
      credentialProvider: credsProvider(),
    });
    expect(leaderboardClientViaConstructor).toBeInstanceOf(
      PreviewLeaderboardClient
    );
  });
});
