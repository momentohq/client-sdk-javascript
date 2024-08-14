import {SdkError} from '../../../errors';
import {BaseResponseError, BaseResponseSuccess} from '../response-base';
import {GetWebhookSecretResponse} from '../enums';

interface IResponse {
  readonly type: GetWebhookSecretResponse;
}

type Props = {
  secret: string;
  cacheName: string;
  webhookName: string;
};

/**
 * Indicates a Successful GetWebhookSecret request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: GetWebhookSecretResponse.Success =
    GetWebhookSecretResponse.Success;
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

  public override toString() {
    return super.toString() + ': ' + this._webhookName;
  }
}

/**
 * Indicates that an error occurred during the GetWebhookSecret request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: GetWebhookSecretResponse.Error =
    GetWebhookSecretResponse.Error;
  constructor(_innerException: SdkError) {
    super(_innerException);
  }
}

export type Response = Success | Error;
