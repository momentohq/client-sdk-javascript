import {StorageGetResponse} from '../../enums';
import {BaseResponseError, ResponseBase} from '../../response-base';
import {SdkError} from '../../../../errors';
import {StorageValue} from './storage-value';

interface IResponse {
  readonly type: StorageGetResponse;
  value(): StorageValue | undefined;
}

export class Success extends ResponseBase implements IResponse {
  readonly type: StorageGetResponse.Success = StorageGetResponse.Success;
  private readonly _value: StorageValue | undefined;

  constructor(value: StorageValue | undefined) {
    super();
    this._value = value;
  }

  static ofInt(value: number): Success {
    return new Success(StorageValue.ofInt(value));
  }

  static ofDouble(value: number): Success {
    return new Success(StorageValue.ofDouble(value));
  }

  static ofString(value: string): Success {
    return new Success(StorageValue.ofString(value));
  }

  static ofBytes(value: Uint8Array): Success {
    return new Success(StorageValue.ofBytes(value));
  }

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
