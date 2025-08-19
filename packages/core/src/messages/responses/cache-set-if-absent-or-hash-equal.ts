import {SdkError} from '../../errors';
import {BaseResponseError, ResponseBase} from './response-base';
import {CacheSetIfAbsentOrHashEqualResponse} from './enums';

const TEXT_DECODER = new TextDecoder();

interface IResponse {
  readonly type: CacheSetIfAbsentOrHashEqualResponse;
}

/**
 * Indicates either the key does not exist and the value was set or, the key exists
 * and hash value of the stored item is equal to the hash value supplied and the value was set.
 */
export class Stored extends ResponseBase implements IResponse {
  readonly type: CacheSetIfAbsentOrHashEqualResponse.Stored =
    CacheSetIfAbsentOrHashEqualResponse.Stored;

  private readonly _hash: Uint8Array;
  constructor(hash: Uint8Array) {
    super();
    this._hash = hash;
  }

  /**
   * Returns the hash of the data as a utf-8 string, decoded from the underlying byte array.
   * @returns string
   */
  public hashString(): string {
    return TEXT_DECODER.decode(this._hash);
  }

  /**
   * Returns the hash of the data as a byte array.
   * @returns {Uint8Array}
   */
  public hashUint8Array(): Uint8Array {
    return this._hash;
  }
}

/**
 * Indicates the key exists but the hash value is not equal to the hash value supplied and no value was set.
 */
export class NotStored extends ResponseBase implements IResponse {
  readonly type: CacheSetIfAbsentOrHashEqualResponse.NotStored =
    CacheSetIfAbsentOrHashEqualResponse.NotStored;
}

/**
 * Indicates that an error occurred during the CacheSetIfAbsentOrHashEqual request.
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

  readonly type: CacheSetIfAbsentOrHashEqualResponse.Error =
    CacheSetIfAbsentOrHashEqualResponse.Error;
}

export type Response = Stored | NotStored | Error;
