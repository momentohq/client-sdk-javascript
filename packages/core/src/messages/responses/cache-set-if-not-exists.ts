import {SdkError} from '../../errors';
import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {CacheSetIfNotExistsResponse} from './enums';

interface IResponse {
  type: CacheSetIfNotExistsResponse;
}

/**
 * Indicates the key did not exist and the value was set.
 */
export class Stored extends BaseResponseSuccess implements IResponse {
  readonly type: CacheSetIfNotExistsResponse.Stored =
    CacheSetIfNotExistsResponse.Stored;
}

/**
 * Indicates the key already exists and no value was set.
 */
export class NotStored extends BaseResponseSuccess implements IResponse {
  readonly type: CacheSetIfNotExistsResponse.NotStored =
    CacheSetIfNotExistsResponse.NotStored;
}

/**
 * Indicates that an error occurred during the setIfNotExists request.
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

  readonly type: CacheSetIfNotExistsResponse.Error =
    CacheSetIfNotExistsResponse.Error;
}

export type Response = Stored | NotStored | Error;
