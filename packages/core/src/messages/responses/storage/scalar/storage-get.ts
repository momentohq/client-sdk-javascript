import {StorageGetResponse} from '../../enums';
import {BaseResponseError, ResponseBase} from '../../response-base';
import {SdkError} from '../../../../errors';
import {StorageValue} from './storage-value';

interface IResponse {
  readonly type: StorageGetResponse;
  value(): StorageValue | undefined;
}

/**
 * Indicates that the item was fetched from the store.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the successful response:
 *
 * - `value()` - the value associated with the key that was retrieved from the cache.
 */
export class Found extends ResponseBase implements IResponse {
  readonly type: StorageGetResponse.Found = StorageGetResponse.Found;
  private readonly _value: StorageValue;

  /**
   * Creates an instance of the Found response.
   * @param {StorageValue} value - The value associated with the key that was retrieved from the cache.
   */
  constructor(value: StorageValue) {
    super();
    this._value = value;
  }

  /**
   * Creates a Found response with an integer value.
   * @param {number} value - The integer value to be stored.
   * @returns {Found} - A Found response object containing the integer value.
   */
  static ofInt(value: number): Found {
    return new Found(StorageValue.ofInt(value));
  }

  /**
   * Creates a Found response with a double value.
   * @param {number} value - The double value to be stored.
   * @returns {Found} - A Found response object containing the double value.
   */
  static ofDouble(value: number): Found {
    return new Found(StorageValue.ofDouble(value));
  }

  /**
   * Creates a Found response with a string value.
   * @param {string} value - The string value to be stored.
   * @returns {Found} - A Found response object containing the string value.
   */
  static ofString(value: string): Found {
    return new Found(StorageValue.ofString(value));
  }

  /**
   * Creates a Found response with a byte array value.
   * @param {Uint8Array} value - The byte array value to be stored.
   * @returns {Found} - A Found response object containing the byte array value.
   */
  static ofBytes(value: Uint8Array): Found {
    return new Found(StorageValue.ofBytes(value));
  }

  /**
   * Retrieves the value associated with the key that was retrieved from the cache.
   * @returns {StorageValue} - The value associated with the key, or undefined if no value is present.
   */
  value(): StorageValue {
    return this._value;
  }
}

/**
 * Indicates that the item was not found in the store.
 */
export class NotFound extends ResponseBase implements IResponse {
  readonly type: StorageGetResponse.NotFound = StorageGetResponse.NotFound;

  constructor() {
    super();
  }

  value(): undefined {
    return;
  }
}

/**
 * Indicates that an error occurred during the storage get request.
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
    return;
  }
}

export type Response = Found | NotFound | Error;
