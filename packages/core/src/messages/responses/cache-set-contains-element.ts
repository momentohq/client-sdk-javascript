import {SdkError} from '../../errors';
import {
  BaseResponseError,
  BaseResponseMiss,
  ResponseBase,
} from './response-base';
import {CacheSetContainsElementResponse} from './enums';

interface IResponse {
  containsElement(): boolean | undefined;
  readonly type: CacheSetContainsElementResponse;
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `value*` accessors to retrieve the data in the appropriate format.
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
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  readonly type: CacheSetContainsElementResponse.Miss =
    CacheSetContainsElementResponse.Miss;

  constructor() {
    super();
  }

  public containsElement(): undefined {
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
  readonly type: CacheSetContainsElementResponse.Error =
    CacheSetContainsElementResponse.Error;

  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  public containsElement(): undefined {
    return undefined;
  }
}

export type Response = Hit | Miss | Error;
