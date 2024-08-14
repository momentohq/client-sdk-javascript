import {SdkError} from '../../../errors';
import {BaseResponseError, BaseResponseSuccess} from '../response-base';
import {PutWebhookResponse} from '../enums';

interface IResponse {
  readonly type: PutWebhookResponse;
}

/**
 * Indicates a Successful PutWebhook request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type = PutWebhookResponse.Success;
  private readonly _secretString: string;

  constructor(secretString: string) {
    super();
    this._secretString = secretString;
  }

  secretString(): string {
    return this._secretString;
  }
}

/**
 * Indicates that an error occurred during the PutWebhook request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: PutWebhookResponse.Error = PutWebhookResponse.Error;
  constructor(_innerException: SdkError) {
    super(_innerException);
  }
}

export type Response = Success | Error;
