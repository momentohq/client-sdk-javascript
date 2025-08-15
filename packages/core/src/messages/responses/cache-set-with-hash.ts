import {SdkError} from '../../errors';
import {BaseResponseError, ResponseBase} from './response-base';
import {CacheSetWithHashResponse} from './enums';

const TEXT_DECODER = new TextDecoder();

interface IResponse {
  readonly type: CacheSetWithHashResponse;
}

/**
 * Indicates the value was set and returns hash of the value.
 */
export class Stored extends ResponseBase implements IResponse {
  readonly type: CacheSetWithHashResponse.Stored =
    CacheSetWithHashResponse.Stored;

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
 * Indicates that no value was set because the key was not able to be set.
 */
export class NotStored extends ResponseBase implements IResponse {
  readonly type: CacheSetWithHashResponse.NotStored =
    CacheSetWithHashResponse.NotStored;
}

/**
 * Indicates that an error occurred during the cache setWithHash request.
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

  readonly type: CacheSetWithHashResponse.Error =
    CacheSetWithHashResponse.Error;
}

export type Response = Stored | NotStored | Error;
