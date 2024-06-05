import {SdkError} from '../../errors';
import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {CacheSetIfEqualResponse} from './enums';

interface IResponse {
  readonly type: CacheSetIfEqualResponse;
}

/**
 * Indicates the new value was set because the key already exists and the existing item was equal to the supplied `equal` value.
 */
export class Stored extends BaseResponseSuccess implements IResponse {
  readonly type: CacheSetIfEqualResponse.Stored =
    CacheSetIfEqualResponse.Stored;
}

/**
 * Indicates that no value was set because the key did not exist or because the existing item was not equal to the supplied `equal` value.
 */
export class NotStored extends BaseResponseSuccess implements IResponse {
  readonly type: CacheSetIfEqualResponse.NotStored =
    CacheSetIfEqualResponse.NotStored;
}

/**
 * Indicates that an error occurred during the setIfEqual request.
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

  readonly type: CacheSetIfEqualResponse.Error = CacheSetIfEqualResponse.Error;
}

export type Response = Stored | NotStored | Error;
