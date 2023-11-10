import {CredentialProvider} from '@gomomento/sdk-core';
import {CacheClient, Configurations} from '../../../src';
import {PingClient} from '../../../src/internal/ping-client';
import {expectWithMessage} from '@gomomento/common-integration-tests';
import {CacheClientProps} from '../../../src/cache-client-props';
import {describe, it, expect} from 'vitest';

describe('ping service', () => {
  it('ping should work', async () => {
    const cacheClientProps: CacheClientProps = {
      configuration: Configurations.Laptop.latest(),
      credentialProvider: CredentialProvider.fromEnvironmentVariable({
        environmentVariableName: 'TEST_AUTH_TOKEN',
      }),
      defaultTtlSeconds: 1111,
    };
    const cacheClient = new CacheClient(cacheClientProps);
    await cacheClient.ping();
  });
  it.skip('should fail on bad URL', async () => {
    const pingClient = new PingClient({
      endpoint: 'https://not_a_valid_dns_name',
      configuration: Configurations.Laptop.latest(),
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
