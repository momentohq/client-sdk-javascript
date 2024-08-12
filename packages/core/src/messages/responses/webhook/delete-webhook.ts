import {SdkError} from '../../../errors';
import {BaseResponseError, BaseResponseSuccess} from '../response-base';
import {DeleteWebhookResponse} from '../enums';

interface IResponse {
  readonly type: DeleteWebhookResponse;
}

/**
 * Indicates a Successful delete webhook request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type = DeleteWebhookResponse.Success;
}

/**
 * Indicates that an error occurred during the delete webhook request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: DeleteWebhookResponse.Error = DeleteWebhookResponse.Error;
  constructor(_innerException: SdkError) {
    super(_innerException);
  }
}

export type Response = Success | Error;
