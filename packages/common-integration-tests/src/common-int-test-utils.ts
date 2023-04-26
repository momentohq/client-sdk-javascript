import {CollectionTtl, DeleteCache, MomentoErrorCode} from '@gomomento/core';
import {ICacheClient} from '@gomomento/core/dist/src/internal/clients/cache/ICacheClient';
import {
  IResponseError,
  ResponseBase,
} from '@gomomento/core/dist/src/messages/responses/response-base';
import {v4} from 'uuid';

export function testCacheName(): string {
  const name = process.env.TEST_CACHE_NAME || 'js-integration-test-default';
  return name + v4();
}

export const deleteCacheIfExists = async (
  client: ICacheClient,
  cacheName: string
) => {
  const deleteResponse = await client.deleteCache(cacheName);
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

export interface ValidateCacheProps {
  cacheName: string;
}

export interface ValidateListProps extends ValidateCacheProps {
  listName: string;
}

export interface ValidateDictionaryProps extends ValidateCacheProps {
  dictionaryName: string;
  field: string | Uint8Array;
}

export interface ValidateDictionaryChangerProps
  extends ValidateDictionaryProps {
  value: string | Uint8Array;
  ttl?: CollectionTtl;
}

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

const bytesEncoderForTests = new TextEncoder();

/**
 * TODO
 * TODO
 * TODO explain
 * TODO
 * TODO
 *
 * @param {string} value
 * @returns {Uint8Array}
 */
export function uint8ArrayForTest(value: string): Uint8Array {
  return Uint8Array.from(bytesEncoderForTests.encode(value));
}
