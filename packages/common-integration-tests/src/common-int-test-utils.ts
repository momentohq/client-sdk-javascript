import {
  CollectionTtl,
  MomentoErrorCode,
  CreateCacheResponse,
  DeleteCacheResponse,
} from '@gomomento/sdk-core';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/clients/ICacheClient';
import {
  IResponseError,
  ResponseBase,
} from '@gomomento/sdk-core/dist/src/messages/responses/response-base';
import {v4} from 'uuid';

const isInsideGithubCI = process.env.CI === 'true';
const itif = (condition: boolean) => (condition ? it : it.skip);
const maybe = (condition: boolean) => (condition ? describe : describe.skip);
/**
 * Only runs the tests inside the 'it' block if inside a continuous integration environment.
 */
export const itOnlyInCi = itif(isInsideGithubCI);
/**
 * Only runs the test inside the 'describe' block if inside a continuous integration environment.
 */
export const describeOnlyInCi = maybe(isInsideGithubCI);

export function isLocalhostDevelopmentMode(): boolean {
  const useLocalhost = process.env.MOMENTO_SDK_TESTS_USE_LOCALHOST;
  return useLocalhost !== undefined;
}
export function testCacheName(): string {
  return `js-integration-test-default-${v4()}`;
}

export function testTopicName(): string {
  return `js-integration-test-topic-${v4()}`;
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
  if (deleteResponse.type === DeleteCacheResponse.Error) {
    if (deleteResponse.errorCode() !== MomentoErrorCode.CACHE_NOT_FOUND_ERROR) {
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
  if (createResponse.type === CreateCacheResponse.Error) {
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
