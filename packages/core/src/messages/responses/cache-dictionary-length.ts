import {SdkError} from '../../errors';
import {
  BaseResponseError,
  BaseResponseMiss,
  ResponseBase,
} from './response-base';
import {CacheDictionaryLengthResponse} from './enums';

interface IResponse {
  value(): number | undefined;
  readonly type: CacheDictionaryLengthResponse;
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `value*` accessors to retrieve the data in the appropriate format.
 */
export class Hit extends ResponseBase implements IResponse {
  private readonly _length: number;
  constructor(length: number) {
    super();
    this._length = length;
  }

  /**
   * Returns the length of the dictionary
   * @returns {number}
   */
  public length(): number {
    return this._length;
  }

  public override toString(): string {
    return `${super.toString()}: length ${this._length}`;
  }

  readonly type: CacheDictionaryLengthResponse.Hit =
    CacheDictionaryLengthResponse.Hit;

  value(): number {
    return this._length;
  }
}

/**
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  readonly type: CacheDictionaryLengthResponse.Miss =
    CacheDictionaryLengthResponse.Miss;

  value(): undefined {
    return;
  }
}

/**
 * Indicates that an error occurred during the dictionary length request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  readonly type: CacheDictionaryLengthResponse.Error =
    CacheDictionaryLengthResponse.Error;

  value(): undefined {
    return;
  }
}

export type Response = Hit | Miss | Error;
