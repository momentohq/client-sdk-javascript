import {
  CredentialProvider,
  MomentoLoggerFactory,
  NoopMomentoLoggerFactory,
} from '@gomomento/sdk-core';
import {CacheClient} from '../../src';
import {PingClient} from '../../src/internal/ping-client';
import {expectWithMessage} from '@gomomento/common-integration-tests';

describe('ping service', () => {
  it('ping should work', async () => {
    const cacheClient = new CacheClient({
      credentialProvider: CredentialProvider.fromEnvironmentVariable({
        environmentVariableName: 'TEST_AUTH_TOKEN',
      }),
    });
    await cacheClient.ping();
  });
  it('should fail on bad URL', async () => {
    const pingClient = new PingClient({
      endpoint: 'bad.url',
      configuration: {
        getLoggerFactory(): MomentoLoggerFactory {
          return new NoopMomentoLoggerFactory();
        },
      },
    });
    try {
      await pingClient.ping();
      // we shouldn't get to the assertion below
      expect(true).toBeFalse();
    } catch (error) {
      expectWithMessage(() => {
        expect((error as Error).name).toEqual('RpcError');
      }, `expected RpcError but got ${(error as Error).toString()}`);
    }
  });
});
