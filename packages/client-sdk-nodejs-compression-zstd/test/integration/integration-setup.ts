import {
  CacheClient,
  Configuration,
  Configurations,
  CreateCache,
  CredentialProvider,
  DeleteCache,
  MomentoErrorCode,
  ReadConcern,
} from '@gomomento/sdk';
import {v4} from 'uuid';
import {CacheClientProps} from '@gomomento/sdk/dist/src/cache-client-props';

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
export interface CacheClientPropsWithConfig extends CacheClientProps {
  configuration: Configuration;
}

function testCacheName(): string {
  return `js-integration-test-compression-${v4()}`;
}

let _credsProvider: CredentialProvider | undefined = undefined;

export function credsProvider(): CredentialProvider {
  if (_credsProvider === undefined) {
    _credsProvider = CredentialProvider.fromEnvVarV2();
  }
  return _credsProvider;
}

function useConsistentReads(): boolean {
  return process.argv.find(arg => arg === 'useConsistentReads') !== undefined;
}

function integrationTestCacheClientProps(): CacheClientPropsWithConfig {
  const readConcern = useConsistentReads()
    ? ReadConcern.CONSISTENT
    : ReadConcern.BALANCED;

  return {
    configuration: Configurations.Laptop.latest()
      .withClientTimeoutMillis(90000)
      .withReadConcern(readConcern),
    credentialProvider: credsProvider(),
    defaultTtlSeconds: 1111,
  };
}

function momentoClientForTesting(): CacheClient {
  return new CacheClient(integrationTestCacheClientProps());
}

export function setupIntegrationTest(): {
  cacheClientPropsWithConfig: CacheClientPropsWithConfig;
  cacheName: string;
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

  return {
    cacheClientPropsWithConfig: integrationTestCacheClientProps(),
    cacheName: cacheName,
  };
}

/**
 * Jest doesn't provide a way to emit a custom message when a test fails, so this method
 * provides a wrapper to allow this:
 *
 * ```ts
 * it('fails a simple failing test', () => {
 *   const val = 42;
 *   expectWithMessage(() => {
 *     expect(val).toBeFalse();
 *   }, `it turns out ${val} is not false`);
 * });
 *```
 *
 * @param expected Function containing the `expect` assertion
 * @param message Message to be printed when the test fails
 */
export function expectWithMessage(expected: () => void, message: string) {
  try {
    expected();
  } catch (e) {
    if (e instanceof Error && e.stack !== undefined) {
      message += `\n\nOriginal stack trace:\n${e.stack}`;
    }
    throw new Error(message);
  }
}
