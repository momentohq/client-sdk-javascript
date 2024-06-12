import {SdkError} from '../../errors';
import {BaseResponseError, ResponseBase} from './response-base';
import {CacheSetIfNotEqualResponse} from './enums';

interface IResponse {
  readonly type: CacheSetIfNotEqualResponse;
}

/**
 * Indicates the new value was set because the key did not exist or because the existing item was not equal to the supplied `notEqual` value.
 */
export class Stored extends ResponseBase implements IResponse {
  readonly type: CacheSetIfNotEqualResponse.Stored =
    CacheSetIfNotEqualResponse.Stored;
}

/**
 * Indicates that no value was set because the existing item was equal to the supplied `notEqual` value.
 */
export class NotStored extends ResponseBase implements IResponse {
  readonly type: CacheSetIfNotEqualResponse.NotStored =
    CacheSetIfNotEqualResponse.NotStored;
}

/**
 * Indicates that an error occurred during the setIfNotEqual request.
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

  readonly type: CacheSetIfNotEqualResponse.Error =
    CacheSetIfNotEqualResponse.Error;
}

export type Response = Stored | NotStored | Error;
