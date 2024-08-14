import {SdkError} from '../../../errors';
import {BaseResponseError, BaseResponseSuccess} from '../response-base';
import {Webhook} from '../../webhook';
import {ListWebhooksResponse} from '../enums';

interface IResponse {
  readonly type: ListWebhooksResponse;
}

/**
 * Indicates a Successful list webhooks request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: ListWebhooksResponse.Success = ListWebhooksResponse.Success;
  private readonly _webhooks: Webhook[];
  constructor(webhooks: Webhook[]) {
    super();
    this._webhooks = webhooks;
  }

  /**
   * An array of webhooks.
   * @returns {Webhook[]}
   */
  public getWebhooks(): Webhook[] {
    return this._webhooks;
  }

  public override toString() {
    return (
      super.toString() +
      ': ' +
      this._webhooks.map(webhook => webhook.id.webhookName).join(', ')
    );
  }
}

/**
 * Indicates that an error occurred during the list webhooks request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: ListWebhooksResponse.Error = ListWebhooksResponse.Error;
  constructor(_innerException: SdkError) {
    super(_innerException);
  }
}

export type Response = Success | Error;
