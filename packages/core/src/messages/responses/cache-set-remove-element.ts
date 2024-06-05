import {SdkError} from '../../errors';
import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {CacheSetRemoveElementResponse} from './enums';

interface IResponse {
  readonly type: CacheSetRemoveElementResponse;
}

/**
 * Indicates a Successful set remove element request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: CacheSetRemoveElementResponse.Success =
    CacheSetRemoveElementResponse.Success;
}

/**
 * Indicates that an error occurred during the set remove element request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError {
  readonly type: CacheSetRemoveElementResponse.Error =
    CacheSetRemoveElementResponse.Error;
  constructor(_innerException: SdkError) {
    super(_innerException);
  }
}

export type Response = Success | Error;
