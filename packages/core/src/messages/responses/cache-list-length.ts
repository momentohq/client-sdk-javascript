import {SdkError} from '../../errors';
import {
  BaseResponseError,
  BaseResponseMiss,
  ResponseBase,
} from './response-base';
import {CacheListLengthResponse} from './enums';

interface IResponse {
  value(): number | undefined;
  type: CacheListLengthResponse;
}

/**
 * Indicates that the requested list was successfully retrieved from the cache.
 * Provides `value` and `length` accessors to retrieve the length of the list.
 */
export class Hit extends ResponseBase implements IResponse {
  readonly type: CacheListLengthResponse.Hit = CacheListLengthResponse.Hit;
  private readonly _length: number;

  constructor(length: number) {
    super();
    this._length = length;
  }

  /**
   * Returns the length of the list.
   * @returns number
   */
  public value(): number {
    return this._length;
  }

  /**
   * Returns the length of the list.
   * @returns number
   */
  public length(): number {
    return this._length;
  }

  public override toString(): string {
    return `${super.toString()}: length ${this._length}`;
  }
}

/**
 * Indicates that the requested list was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  readonly type: CacheListLengthResponse.Miss = CacheListLengthResponse.Miss;

  constructor() {
    super();
  }

  value(): undefined {
    return undefined;
  }
}

/**
 * Indicates that an error occurred during the list length request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: CacheListLengthResponse.Error = CacheListLengthResponse.Error;

  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  value(): undefined {
    return undefined;
  }
}

export type Response = Hit | Miss | Error;
