import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {SdkError} from '../../errors';
import * as CacheSetAddElement from './cache-set-add-element';
import {CacheSetAddElementsResponse} from './enums';

interface IResponse {
  type: CacheSetAddElementsResponse;
  toSingularResponse(): CacheSetAddElement.Response;
}

/**
 * Indicates a Successful set add elements request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: CacheSetAddElementsResponse.Success =
    CacheSetAddElementsResponse.Success;
  toSingularResponse(): CacheSetAddElement.Success {
    return new CacheSetAddElement.Success();
  }
}

/**
 * Indicates that an error occurred during the set add elements request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: CacheSetAddElementsResponse.Error =
    CacheSetAddElementsResponse.Error;
  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  toSingularResponse(): CacheSetAddElement.Error {
    return new CacheSetAddElement.Error(this._innerException);
  }
}

export type Response = Success | Error;
