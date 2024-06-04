import {SdkError} from '../../errors';
import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {CacheSetIfAbsentOrEqualResponse} from './enums';

interface IResponse {
  type: CacheSetIfAbsentOrEqualResponse;
}

/**
 * Indicates the new value was set because the key did not exist or the existing item was equal to the supplied `equal` value.
 */
export class Stored extends BaseResponseSuccess implements IResponse {
  readonly type: CacheSetIfAbsentOrEqualResponse.Stored =
    CacheSetIfAbsentOrEqualResponse.Stored;
}

/**
 * Indicates that no value was set because the existing item was not equal to the supplied `equal` value.
 */
export class NotStored extends BaseResponseSuccess implements IResponse {
  readonly type: CacheSetIfAbsentOrEqualResponse.NotStored =
    CacheSetIfAbsentOrEqualResponse.NotStored;
}

/**
 * Indicates that an error occurred during the setIfAbsentOrEqual request.
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

  readonly type: CacheSetIfAbsentOrEqualResponse.Error =
    CacheSetIfAbsentOrEqualResponse.Error;
}

export type Response = Stored | NotStored | Error;
