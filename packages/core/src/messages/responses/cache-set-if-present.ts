import {SdkError} from '../../errors';
import {BaseResponseError, ResponseBase} from './response-base';
import {CacheSetIfPresentResponse} from './enums';

interface IResponse {
  readonly type: CacheSetIfPresentResponse;
}

/**
 * Indicates the key already exists and the value was set.
 */
export class Stored extends ResponseBase implements IResponse {
  readonly type: CacheSetIfPresentResponse.Stored =
    CacheSetIfPresentResponse.Stored;
}

/**
 * Indicates the key did not exist and no value was set.
 */
export class NotStored extends ResponseBase implements IResponse {
  readonly type: CacheSetIfPresentResponse.NotStored =
    CacheSetIfPresentResponse.NotStored;
}

/**
 * Indicates that an error occurred during the setIfPresent request.
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

  readonly type: CacheSetIfPresentResponse.Error =
    CacheSetIfPresentResponse.Error;
}

export type Response = Stored | NotStored | Error;
