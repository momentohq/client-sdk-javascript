import {SdkError} from '../../../errors';
import {BaseResponseError, BaseResponseSuccess} from '../response-base';
import {DeleteFunctionResponse} from '../enums';

interface IResponse {
  readonly type: DeleteFunctionResponse;
}

/**
 * Indicates a successful delete-function request. Deleting a function that does not exist returns an Error
 * with code NOT_FOUND (deletes are not idempotent).
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: DeleteFunctionResponse.Success =
    DeleteFunctionResponse.Success;
}

/**
 * Indicates that an error occurred during the delete-function request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: DeleteFunctionResponse.Error = DeleteFunctionResponse.Error;

  constructor(_innerException: SdkError) {
    super(_innerException);
  }
}

export type Response = Success | Error;
