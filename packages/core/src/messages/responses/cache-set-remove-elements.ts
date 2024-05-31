import * as CacheSetRemoveElement from './cache-set-remove-element';
import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {SdkError} from '../../errors';
import {CacheSetRemoveElementsResponse} from './enums';

interface IResponse {
  type: CacheSetRemoveElementsResponse;
  toSingularResponse(): CacheSetRemoveElement.Response;
}

/**
 * Indicates a Successful set remove elements request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: CacheSetRemoveElementsResponse.Success =
    CacheSetRemoveElementsResponse.Success;
  toSingularResponse(): CacheSetRemoveElement.Success {
    return new CacheSetRemoveElement.Success();
  }
}

/**
 * Indicates that an error occurred during the set remove elements request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: CacheSetRemoveElementsResponse.Error =
    CacheSetRemoveElementsResponse.Error;
  constructor(_innerException: SdkError) {
    super(_innerException);
  }
  toSingularResponse(): CacheSetRemoveElement.Error {
    return new CacheSetRemoveElement.Error(this._innerException);
  }
}

export type Response = Success | Error;
