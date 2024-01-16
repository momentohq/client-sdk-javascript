import {
  CacheClient,
  TopicClient,
  PreviewVectorIndexClient,
  PreviewLeaderboardClient,
} from '../../src';
import {credsProvider} from './integration-setup';

describe('default configurations', () => {
  it('CacheClient should be able to be constructed with a default configuration', () => {
    const cacheClientViaConstructor = new CacheClient({
      credentialProvider: credsProvider(),
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
