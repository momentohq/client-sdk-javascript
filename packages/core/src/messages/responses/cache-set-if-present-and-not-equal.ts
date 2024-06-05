import {SdkError} from '../../errors';
import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {CacheSetIfPresentAndNotEqualResponse} from './enums';

interface IResponse {
  readonly type: CacheSetIfPresentAndNotEqualResponse;
}

/**
 * Indicates the new value was set because the key already exists and the existing item was not equal to the supplied `notEqual` value.
 */
export class Stored extends BaseResponseSuccess implements IResponse {
  readonly type: CacheSetIfPresentAndNotEqualResponse.Stored =
    CacheSetIfPresentAndNotEqualResponse.Stored;
}

/**
 * Indicates that no value was set because the key did not exist or the existing item was equal to the supplied `notEqual` value.
 */
export class NotStored extends BaseResponseSuccess implements IResponse {
  readonly type: CacheSetIfPresentAndNotEqualResponse.NotStored =
    CacheSetIfPresentAndNotEqualResponse.NotStored;
}

/**
 * Indicates that an error occurred during the setIfPresentAndNotEqual request.
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

  readonly type: CacheSetIfPresentAndNotEqualResponse.Error =
    CacheSetIfPresentAndNotEqualResponse.Error;
}

export type Response = Stored | NotStored | Error;
