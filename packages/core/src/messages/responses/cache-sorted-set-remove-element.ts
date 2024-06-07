import {SdkError} from '../../errors';
import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {CacheSortedSetRemoveElementResponse} from './enums';

interface IResponse {
  readonly type: CacheSortedSetRemoveElementResponse;
}

/**
 * Indicates a Successful sorted set put element request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: CacheSortedSetRemoveElementResponse.Success =
    CacheSortedSetRemoveElementResponse.Success;
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
  readonly type: CacheSortedSetRemoveElementResponse.Error =
    CacheSortedSetRemoveElementResponse.Error;

  constructor(error: SdkError) {
    super(error);
  }
}

export type Response = Success | Error;
