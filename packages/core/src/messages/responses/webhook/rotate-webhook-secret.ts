import {SdkError} from '../../../errors';
import {ResponseBase, ResponseError, ResponseSuccess} from '../response-base';

/**
 * Parent response type for a RotateWebhookSecret request.  The
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
 * if (response instanceof RotateWebhookSecret.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `RotateWebhookSecret.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

type Props = {
  secret: string;
  cacheName: string;
  webhookName: string;
};

class _Success extends Response {
  private readonly _secret: string;
  private readonly _webhookName: string;
  private readonly _cacheName: string;
  constructor(props: Props) {
    super();
    this._secret = props.secret;
    this._cacheName = props.cacheName;
    this._webhookName = props.webhookName;
  }

  secret(): string {
    return this._secret;
  }

  webhookName(): string {
    return this._webhookName;
  }

  cacheName(): string {
    return this._cacheName;
  }
}

/**
 * Indicates a Successful RotateWebhookSecret request.
 */
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the RotateWebhookSecret request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
