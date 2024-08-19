import {SdkError} from '../../errors';
import {
  BaseResponseError,
  BaseResponseMiss,
  ResponseBase,
} from './response-base';
import {CacheSetContainsElementResponse} from './enums';

interface IResponse {
  /**
   * Returns a boolean indicating whether the element was found in the cache.
   * @returns {boolean | undefined} A boolean indicating whether the element was found in the cache.
   * If the set itself was not found, (ie the response was a `Miss` or `Error`), this method returns `undefined`.
   */
  containsElement(): boolean | undefined;
  readonly type: CacheSetContainsElementResponse;
}

/**
 * Indicates that the requested set was in the cache.
 * Provides a `containsElement` accessor that returns a boolean indicating whether the element was found.
 */
export class Hit extends ResponseBase implements IResponse {
  private readonly _containsElement: boolean;
  readonly type: CacheSetContainsElementResponse.Hit =
    CacheSetContainsElementResponse.Hit;

  constructor(found: boolean) {
    super();
    this._containsElement = found;
  }

  /**
   * Returns a boolean indicating whether the element was found in the cache.
   * @returns {boolean}
   */
  public containsElement(): boolean {
    return this._containsElement;
  }

  public override toString(): string {
    return `${super.toString()}: Hit - ${
      this._containsElement ? 'true' : 'false'
    }`;
  }
}

/**
 * Indicates that the requested set was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  readonly type: CacheSetContainsElementResponse.Miss =
    CacheSetContainsElementResponse.Miss;

  constructor() {
    super();
  }

  public containsElement(): undefined {
    return;
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
  readonly type: CacheSetContainsElementResponse.Error =
    CacheSetContainsElementResponse.Error;

  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  public containsElement(): undefined {
    return;
  }
}

export type Response = Hit | Miss | Error;
