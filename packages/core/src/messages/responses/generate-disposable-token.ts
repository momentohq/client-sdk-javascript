import {BaseResponseSuccess, BaseResponseError} from './response-base';
import {GenerateDisposableTokenResponse} from './enums';
import {SdkError} from '../../errors';
import {encodeToBase64} from '../../internal/utils';
import {ExpiresAt} from '../../utils';

interface IResponse {
  readonly type: GenerateDisposableTokenResponse;
}

export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: GenerateDisposableTokenResponse.Success =
    GenerateDisposableTokenResponse.Success;

  readonly authToken: string;
  readonly endpoint: string;
  readonly expiresAt: ExpiresAt;

  constructor(apiKey: string, endpoint: string, expiresAt: ExpiresAt) {
    super();
    this.authToken = encodeToBase64(
      JSON.stringify({endpoint: endpoint, api_key: apiKey})
    );
    this.endpoint = endpoint;
    this.expiresAt = expiresAt;
  }
}

/**
 * Indicates that an error occurred during the generate disposable token request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  constructor(innerException: SdkError) {
    super(innerException);
  }

  readonly type: GenerateDisposableTokenResponse.Error =
    GenerateDisposableTokenResponse.Error;
}

export type Response = Success | Error;
