import {SdkError} from '../../errors';
import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {CreateCacheResponse} from './enums';

interface IResponse {
  readonly type: CreateCacheResponse;
}

/**
 * Indicates a successful create cache request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: CreateCacheResponse.Success = CreateCacheResponse.Success;
}

/**
 * Indicates that the cache already exists.
 */
export class AlreadyExists extends BaseResponseSuccess implements IResponse {
  readonly type: CreateCacheResponse.Success = CreateCacheResponse.Success;
}

/**
 * Indicates that an error occurred during the create cache request.
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

  readonly type: CreateCacheResponse.Error = CreateCacheResponse.Error;
}

export type Response = Success | AlreadyExists | Error;
