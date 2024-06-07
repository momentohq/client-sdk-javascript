import {StoreDeleteResponse} from '../../enums';
import {BaseResponseError, BaseResponseSuccess} from '../../response-base';
import {SdkError} from '../../../../errors';

interface IResponse {
  readonly type: StoreDeleteResponse;
}

/**
 * Indicates a Successful store delete request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: StoreDeleteResponse.Success = StoreDeleteResponse.Success;
}

/**
 * Indicates that an error occurred during the store delete request.
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

  readonly type: StoreDeleteResponse.Error = StoreDeleteResponse.Error;
}

export type Response = Success | Error;
