// import {v4} from 'uuid';
// import {CacheClientProps} from '../../src/cache-client-props';
// import {
//   CreateCache,
//   Configurations,
//   DeleteCache,
//   CollectionTtl,
//   MomentoErrorCode,
//   CacheClient,
//   CredentialProvider,
// } from '../../src';
// import {
//   IResponseError,
//   ResponseBase,
// } from '@gomomento/core/dist/src/messages/responses/response-base';
//
import {v4} from 'uuid';

export function testCacheName(): string {
  const name = process.env.TEST_CACHE_NAME || 'js-integration-test-default';
  return name + v4();
}

export const deleteCacheIfExists = async (
  momento: ICacheClient,
  cacheName: string
) => {
  const deleteResponse = await momento.deleteCache(cacheName);
  if (deleteResponse instanceof DeleteCache.Error) {
    if (deleteResponse.errorCode() !== MomentoErrorCode.NOT_FOUND_ERROR) {
      throw deleteResponse.innerException();
    }
  }
};

export async function WithCache(
  client: ICacheClient,
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

// export const IntegrationTestCacheClientProps: CacheClientProps = {
//   configuration: Configurations.Laptop.latest(),
//   credentialProvider: CredentialProvider.fromEnvironmentVariable({
//     environmentVariableName: 'TEST_AUTH_TOKEN',
//   }),
//   defaultTtlSeconds: 1111,
// };
//
// function momentoClientForTesting() {
//   return new CacheClient(IntegrationTestCacheClientProps);
// }
//
// export function SetupIntegrationTest(): {
//   Momento: CacheClient;
//   IntegrationTestCacheName: string;
// } {
//   const cacheName = testCacheName();
//
//   beforeAll(async () => {
//     // Use a fresh client to avoid test interference with setup.
//     const momento = momentoClientForTesting();
//     await deleteCacheIfExists(momento, cacheName);
//     const createResponse = await momento.createCache(cacheName);
//     if (createResponse instanceof CreateCache.Error) {
//       throw createResponse.innerException();
//     }
//   });
//
//   afterAll(async () => {
//     // Use a fresh client to avoid test interference with teardown.
//     const momento = momentoClientForTesting();
//     const deleteResponse = await momento.deleteCache(cacheName);
//     if (deleteResponse instanceof DeleteCache.Error) {
//       throw deleteResponse.innerException();
//     }
//   });
//
//   const client = momentoClientForTesting();
//   return {Momento: client, IntegrationTestCacheName: cacheName};
// }

import {
  IResponseError,
  ResponseBase,
} from '@gomomento/core/dist/src/messages/responses/response-base';
import {DeleteCache, MomentoErrorCode} from '@gomomento/core';
import {ICacheClient} from '@gomomento/core/dist/src/internal/clients/cache/ICacheClient';

export interface ValidateCacheProps {
  cacheName: string;
}
//
// export interface ValidateListProps extends ValidateCacheProps {
//   listName: string;
// }
//
// export interface ValidateDictionaryProps extends ValidateCacheProps {
//   dictionaryName: string;
//   field: string | Uint8Array;
// }
//
// export interface ValidateDictionaryChangerProps
//   extends ValidateDictionaryProps {
//   value: string | Uint8Array;
//   ttl?: CollectionTtl;
// }
//
// export interface ValidateSetProps extends ValidateCacheProps {
//   setName: string;
// }
//
// export interface ValidateSortedSetProps extends ValidateCacheProps {
//   sortedSetName: string;
//   value: string | Uint8Array;
// }
//
// export interface ValidateSortedSetChangerProps extends ValidateSortedSetProps {
//   score: number;
//   ttl?: CollectionTtl;
// }
//
export function ItBehavesLikeItValidatesCacheName(
  getResponse: (props: ValidateCacheProps) => Promise<ResponseBase>
) {
  it('validates its cache name', async () => {
    const response = await getResponse({cacheName: '   '});

    expect((response as IResponseError).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
    expect((response as IResponseError).message()).toEqual(
      'Invalid argument passed to Momento client: cache name must not be empty'
    );
  });
}
