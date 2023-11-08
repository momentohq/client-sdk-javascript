import {SdkError} from '../../../errors';
import {ResponseBase, ResponseError, ResponseSuccess} from '../response-base';
import {WebhookItem} from '../../webhook';

/**
 * Parent response type for a list webhooks request.  The
 * response object is resolved to a type-safe object of one of
 * the following subtypes:
 *
 * - {Success}
 * - {Error}
 *
 * `instanceof` type guards can be used to operate on the appropriate subtype.
 * @example
 * For example:
 * ```
 * if (response instanceof ListWebhooks.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `ListWebhooks.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

class _Success extends Response {
  private readonly webhookItems: WebhookItem[];
  constructor(webhookItems: WebhookItem[]) {
    super();
    this.webhookItems = webhookItems;
  }

  /**
   * An array of webhook items.
   * @returns {WebhookItem[]}
   */
  public getWebhookItems() {
    return this.webhookItems;
  }

  public override toString() {
    return (
      super.toString() +
      ': ' +
      this.webhookItems.map(wh => wh.webhook.id.webhookName).join(', ')
    );
  }
}

/**
 * Indicates a Successful list webhooks request.
 */
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
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
export class Error extends ResponseError(_Error) {}
