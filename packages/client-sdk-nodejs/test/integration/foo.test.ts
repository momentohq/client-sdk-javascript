import {CacheClient, CredentialProvider, Configurations} from '../../src';

describe('foo', () => {
  console.log('\n\n\n\nFOOOOO\n\n\n');
  it('does stuff', async () => {
    console.log('TEST!!');
    const client = new CacheClient({
      credentialProvider: CredentialProvider.fromEnvironmentVariable({
        environmentVariableName: 'TEST_AUTH_TOKEN',
      }),
      configuration: Configurations.Laptop.v1(),
      defaultTtlSeconds: 60 * 20,
    });
    await client.createCache('cache-nodejs');
    console.log(
      `SET: ${(await client.set('cache-nodejs', 'foo', 'FOO')).toString()}`
    );
    console.log(
      `LIST SET: ${(
        await client.listConcatenateFront('cache-nodejs', 'myList', [
          'a',
          'b',
          'c',
        ])
      ).toString()}`
    );
    console.log(
      `DICT SET: ${(
        await client.dictionarySetFields('cache-nodejs', 'myDict', {
          a: 'A',
          b: 'B',
        })
      ).toString()}`
    );
  });
});
