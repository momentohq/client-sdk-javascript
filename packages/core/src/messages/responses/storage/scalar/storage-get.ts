import {StorageGetResponse} from '../../enums';
import {BaseResponseError, ResponseBase} from '../../response-base';
import {SdkError} from '../../../../errors';
import {StorageValue} from './storage-value';

interface IResponse {
  readonly type: StorageGetResponse;
  value(): StorageValue | undefined;
}

/**
 * Indicates that the store get request was successful.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the successful response:
 *
 * - `value()` - the value associated with the key that was retrieved from the cache.
 */
export class Success extends ResponseBase implements IResponse {
  readonly type: StorageGetResponse.Success = StorageGetResponse.Success;
  private readonly _value: StorageValue | undefined;

  /**
   * Creates an instance of the Success response.
   * @param {StorageValue | undefined} value - The value associated with the key that was retrieved from the cache.
   */
  constructor(value: StorageValue | undefined) {
    super();
    this._value = value;
  }

  /**
   * Creates a Success response with an integer value.
   * @param {number} value - The integer value to be stored.
   * @returns {Success} - A Success response object containing the integer value.
   */
  static ofInt(value: number): Success {
    return new Success(StorageValue.ofInt(value));
  }

  /**
   * Creates a Success response with a double value.
   * @param {number} value - The double value to be stored.
   * @returns {Success} - A Success response object containing the double value.
   */
  static ofDouble(value: number): Success {
    return new Success(StorageValue.ofDouble(value));
  }

  /**
   * Creates a Success response with a string value.
   * @param {string} value - The string value to be stored.
   * @returns {Success} - A Success response object containing the string value.
   */
  static ofString(value: string): Success {
    return new Success(StorageValue.ofString(value));
  }

  /**
   * Creates a Success response with a byte array value.
   * @param {Uint8Array} value - The byte array value to be stored.
   * @returns {Success} - A Success response object containing the byte array value.
   */
  static ofBytes(value: Uint8Array): Success {
    return new Success(StorageValue.ofBytes(value));
  }

  /**
   * Retrieves the value associated with the key that was retrieved from the cache.
   * @returns {StorageValue | undefined} - The value associated with the key, or undefined if no value is present.
   */
  value(): StorageValue | undefined {
    return this._value;
  }
}

/**
 * Indicates that an error occurred during the cache get request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: StorageGetResponse.Error = StorageGetResponse.Error;
  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  value(): undefined {
    return undefined;
  }
}

export type Response = Success | Error;
