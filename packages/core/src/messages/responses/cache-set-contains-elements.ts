import {SdkError} from '../../errors';
import {
  BaseResponseError,
  BaseResponseMiss,
  ResponseBase,
} from './response-base';
import {truncateString} from '../../internal/utils';
import {CacheSetContainsElementsResponse} from './enums';

const TEXT_DECODER = new TextDecoder();

interface IResponse {
  containsElements(): Record<string, boolean> | undefined;
  readonly type: CacheSetContainsElementsResponse;
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `value*` accessors to retrieve the data in the appropriate format.
 */
export class Hit extends ResponseBase implements IResponse {
  private readonly _contains: Record<string, boolean>;
  readonly type: CacheSetContainsElementsResponse.Hit =
    CacheSetContainsElementsResponse.Hit;

  constructor(elements: Uint8Array[], found: boolean[]) {
    super();
    this._contains = elements.reduce<Record<string, boolean>>(
      (acc, element, index) => {
        acc[TEXT_DECODER.decode(element)] = found[index];
        return acc;
      },
      {}
    );
  }

  /**
   * Returns a mapping of the elements to their presence in the cache.
   * @returns {Record<string, boolean>}
   */
  public containsElements(): Record<string, boolean> {
    return this._contains;
  }

  public override toString(): string {
    const display = truncateString(
      Object.entries(this._contains)
        .map(
          ([element, isPresent]) =>
            `${element}: ${isPresent ? 'true' : 'false'}`
        )
        .join(', ')
    );
    return `${super.toString()}: ${display}`;
  }
}

/**
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  readonly type: CacheSetContainsElementsResponse.Miss =
    CacheSetContainsElementsResponse.Miss;

  constructor() {
    super();
  }

  public containsElements(): Record<string, boolean> | undefined {
    return undefined;
  }
}

/**
 * Indicates that an error occurred during the set contains element request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: CacheSetContainsElementsResponse.Error =
    CacheSetContainsElementsResponse.Error;

  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  public containsElements(): Record<string, boolean> | undefined {
    return undefined;
  }
}

export type Response = Hit | Miss | Error;
