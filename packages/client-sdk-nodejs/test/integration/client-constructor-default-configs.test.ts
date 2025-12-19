import {
  CacheClient,
  TopicClient,
  PreviewLeaderboardClient,
  CredentialProvider,
} from '../../src';
import {credsProvider} from './integration-setup';

// These tokens have valid syntax, but they don't actually have valid credentials.  Just used for unit testing.
const fakeTestV1ApiKey =
  'eyJhcGlfa2V5IjogImV5SjBlWEFpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5leUpwYzNNaU9pSlBibXhwYm1VZ1NsZFVJRUoxYVd4a1pYSWlMQ0pwWVhRaU9qRTJOemd6TURVNE1USXNJbVY0Y0NJNk5EZzJOVFV4TlRReE1pd2lZWFZrSWpvaUlpd2ljM1ZpSWpvaWFuSnZZMnRsZEVCbGVHRnRjR3hsTG1OdmJTSjkuOEl5OHE4NExzci1EM1lDb19IUDRkLXhqSGRUOFVDSXV2QVljeGhGTXl6OCIsICJlbmRwb2ludCI6ICJ0ZXN0Lm1vbWVudG9ocS5jb20ifQo=';

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
        CredentialProvider.fromEnvironmentVariable('V1_API_KEY'),
      defaultTtlSeconds: 60,
    });
    expect(cacheClientViaConstructor).toBeInstanceOf(CacheClient);
  });

  it('CacheClient should be able to be constructed with a simple string for env var, using short function name', () => {
    const cacheClientViaConstructor = new CacheClient({
      credentialProvider: CredentialProvider.fromEnvVar('V1_API_KEY'),
      defaultTtlSeconds: 60,
    });
    expect(cacheClientViaConstructor).toBeInstanceOf(CacheClient);
  });

  it('CacheClient should be able to be constructed with default fromEnvVarV2', () => {
    const cacheClientViaConstructor = new CacheClient({
      credentialProvider: CredentialProvider.fromEnvVarV2(),
      defaultTtlSeconds: 60,
    });
    expect(cacheClientViaConstructor).toBeInstanceOf(CacheClient);
  });

  it('CacheClient should be able to be constructed with a simple string for fromString', () => {
    const cacheClientViaConstructor = new CacheClient({
      credentialProvider: CredentialProvider.fromString(fakeTestV1ApiKey),
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

  it('LeaderboardClient should be able to be constructed with a default configuration', () => {
    const leaderboardClientViaConstructor = new PreviewLeaderboardClient({
      credentialProvider: credsProvider(),
    });
    expect(leaderboardClientViaConstructor).toBeInstanceOf(
      PreviewLeaderboardClient
    );
  });
});
