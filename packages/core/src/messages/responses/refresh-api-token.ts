import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';
import {SdkError} from '../../errors';
import {encodeToBase64} from '../../internal/utils';
import {ExpiresAt} from '../../utils/expiration';

export abstract class Response extends ResponseBase {}

class _Success extends Response {
  readonly apiToken: string;
  readonly refreshToken: string;
  readonly endpoint: string;
  readonly expiresAt: ExpiresAt;

  constructor(
    apiToken: string,
    refreshToken: string,
    endpoint: string,
    expiresAt: ExpiresAt
  ) {
    super();
    this.apiToken = apiToken;
    this.refreshToken = refreshToken;
    this.endpoint = endpoint;
    this.expiresAt = expiresAt;
  }

  public getApiToken(): string {
    return encodeToBase64(
      JSON.stringify({endpoint: this.endpoint, api_key: this.apiToken})
    );
  }

  public getRefreshToken(): string {
    return this.refreshToken;
  }

  public getExpiresAt(): ExpiresAt {
    return this.expiresAt;
  }
}

/**
 * Indicates a Successful generate api token request.
 */
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the generate api token request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
