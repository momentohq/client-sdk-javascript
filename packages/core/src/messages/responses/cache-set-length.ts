import {
  BaseResponseError,
  BaseResponseMiss,
  ResponseBase,
} from './response-base';
import {CacheSetLengthResponse} from './enums';
import {SdkError} from '../../errors';

interface IResponse {
  length(): number | undefined;
  readonly type: CacheSetLengthResponse;
}
/**
 * Indicates that the requested data was successfully retrieved from the cache.
 */
export class Hit extends ResponseBase implements IResponse {
  private readonly _length: number;
  readonly type: CacheSetLengthResponse.Hit = CacheSetLengthResponse.Hit;

  constructor(length: number) {
    super();
    this._length = length;
  }

  /**
   * Returns the length of the set
   * @returns {number}
   */
  public length(): number {
    return this._length;
  }

  public override toString(): string {
    return `${super.toString()}: length ${this._length}`;
  }
}

/**
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  readonly type: CacheSetLengthResponse.Miss = CacheSetLengthResponse.Miss;

  constructor() {
    super();
  }

  public length(): undefined {
    return;
  }
}

/**
 * Indicates that an error occurred during the set length request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: CacheSetLengthResponse.Error = CacheSetLengthResponse.Error;

  constructor(error: SdkError) {
    super(error);
  }

  public length(): undefined {
    return;
  }
}

export type Response = Hit | Miss | Error;
