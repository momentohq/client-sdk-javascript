import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {CacheSortedSetRemoveElementsResponse} from './enums';
import {SdkError} from '../../errors';

interface IResponse {
  readonly type: CacheSortedSetRemoveElementsResponse;
}

/**
 * Indicates a Successful sorted set put element request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: CacheSortedSetRemoveElementsResponse.Success =
    CacheSortedSetRemoveElementsResponse.Success;
}

/**
 * Indicates that an error occurred during the sorted set put element request.
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
  readonly type: CacheSortedSetRemoveElementsResponse.Error =
    CacheSortedSetRemoveElementsResponse.Error;
}

export type Response = Success | Error;
