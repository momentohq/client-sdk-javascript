import {
  CollectionTtl,
  CreateCache,
  CreateVectorIndex,
  DeleteCache,
  DeleteVectorIndex,
  MomentoErrorCode,
} from '@gomomento/sdk-core';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/clients/ICacheClient';
import {
  IResponseError,
  ResponseBase,
} from '@gomomento/sdk-core/dist/src/messages/responses/response-base';
import {v4} from 'uuid';
import {IVectorClient} from '@gomomento/sdk-core/dist/src/clients/IVectorClient';

export function isLocalhostDevelopmentMode(): boolean {
  const useLocalhost = process.env.MOMENTO_SDK_TESTS_USE_LOCALHOST;
  return useLocalhost !== undefined;
}
export function testCacheName(): string {
  return process.env.TEST_CACHE_NAME || `js-integration-test-default-${v4()}`;
}

export function testIndexName(): string {
  return v4();
}

export const deleteCacheIfExists = async (
  client: ICacheClient,
  cacheName: string
) => {
  if (isLocalhostDevelopmentMode()) {
    console.log(
      `LOCALHOST DEVELOPMENT MODE: skipping delete cache command for cache '${cacheName}`
    );
    return;
  }
  const deleteResponse = await client.deleteCache(cacheName);
  if (deleteResponse instanceof DeleteCache.Error) {
    if (deleteResponse.errorCode() !== MomentoErrorCode.NOT_FOUND_ERROR) {
      throw deleteResponse.innerException();
    }
  }
};

export const createCacheIfNotExists = async (
  client: ICacheClient,
  cacheName: string
) => {
  if (isLocalhostDevelopmentMode()) {
    console.log(
      `LOCALHOST DEVELOPMENT MODE: skipping create cache command for cache '${cacheName}`
    );
    return;
  }
  const createResponse = await client.createCache(cacheName);
  if (createResponse instanceof CreateCache.Error) {
    throw createResponse.innerException();
  }
};

export async function WithCache(
  client: ICacheClient,
  cacheName: string,
  block: () => Promise<void>
) {
  await deleteCacheIfExists(client, cacheName);
  await createCacheIfNotExists(client, cacheName);
  try {
    await block();
  } finally {
    await deleteCacheIfExists(client, cacheName);
  }
}

export const deleteIndexIfExists = async (
  client: IVectorClient,
  indexName: string
) => {
  if (isLocalhostDevelopmentMode()) {
    console.log(
      `LOCALHOST DEVELOPMENT MODE: skipping delete index command for index '${indexName}`
    );
    return;
  }
  const deleteResponse = await client.deleteIndex(indexName);
  if (deleteResponse instanceof DeleteVectorIndex.Error) {
    if (deleteResponse.errorCode() !== MomentoErrorCode.NOT_FOUND_ERROR) {
      throw deleteResponse.innerException();
    }
  }
};

export const createIndexIfNotExists = async (
  client: IVectorClient,
  indexName: string
) => {
  if (isLocalhostDevelopmentMode()) {
    console.log(
      `LOCALHOST DEVELOPMENT MODE: skipping create index command for index '${indexName}`
    );
    return;
  }
  const createResponse = await client.createIndex(indexName, 10);
  if (createResponse instanceof CreateVectorIndex.Error) {
    throw createResponse.innerException();
  }
};

export async function WithIndex(
  client: IVectorClient,
  indexName: string,
  block: () => Promise<void>
) {
  await deleteIndexIfExists(client, indexName);
  await createIndexIfNotExists(client, indexName);
  try {
    await block();
  } finally {
    await deleteIndexIfExists(client, indexName);
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

export interface ValidateSetProps extends ValidateCacheProps {
  setName: string;
}

export interface ValidateSortedSetProps extends ValidateCacheProps {
  sortedSetName: string;
  value: string | Uint8Array;
}

export interface ValidateSortedSetChangerProps extends ValidateSortedSetProps {
  score: number;
  ttl?: CollectionTtl;
}

export interface ValidateTopicProps {
  topicName: string;
}

export interface ValidateVectorProps {
  indexName: string;
  numDimensions: number;
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

export function ItBehavesLikeItValidatesTopicName(
  getResponse: (props: ValidateTopicProps) => Promise<ResponseBase>
) {
  it('validates its topic name', async () => {
    const response = await getResponse({topicName: '   '});
    expect((response as IResponseError).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
    expect((response as IResponseError).message()).toEqual(
      'Invalid argument passed to Momento client: topic name must not be empty'
    );
  });
}

export function ItBehavesLikeItValidatesIndexName(
  getResponse: (props: ValidateVectorProps) => Promise<ResponseBase>
) {
  it('validates its index name', async () => {
    const response = await getResponse({indexName: '   ', numDimensions: 1});
    expect((response as IResponseError).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
    expect((response as IResponseError).message()).toEqual(
      'Invalid argument passed to Momento client: index name must not be empty'
    );
  });
}

export function ItBehavesLikeItValidatesNumDimensions(
  getResponse: (props: ValidateVectorProps) => Promise<ResponseBase>
) {
  it('validates its numDimensions', async () => {
    const response = await getResponse({
      indexName: v4(),
      numDimensions: 0,
    });
    expect((response as IResponseError).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
    expect((response as IResponseError).message()).toEqual(
      'Invalid argument passed to Momento client: numDimensions must be greater than zero'
    );
  });
}

// TODO: uncomment when Configuration is plumbed through
// export function ItBehavesLikeItValidatesRequestTimeout(requestTimeout: number) {
//   it(`should be throw an error for an invalid request timeout (requestTimeout=${requestTimeout})`, () => {
//     expect(() => {
//       new TopicClient({
//         configuration:
//           IntegrationTestCacheClientProps.configuration.withClientTimeoutMillis(
//             requestTimeout
//           ),
//         credentialProvider: IntegrationTestCacheClientProps.credentialProvider,
//       });
//     }).toThrowError(
//       new InvalidArgumentError('request timeout must be greater than zero.')
//     );
//   });
// }

const bytesEncoderForTests = new TextEncoder();

/**
 * The nodejs SDK and the web SDK differ in how their TextEncoders encode Uint8Array values.
 * Although the array byte data is the same, differences in the backing representation
 * trip Jest up causing tests to fail. This function replaces the TextEncoder and normalizes
 * the Uint8Array data encoding to a simple array of ints.
 *
 * @param {string} value
 * @returns {Uint8Array}
 */
export function uint8ArrayForTest(value: string): Uint8Array {
  return Uint8Array.from(bytesEncoderForTests.encode(value));
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
