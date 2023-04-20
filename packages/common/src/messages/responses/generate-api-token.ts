import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';
import {SdkError} from '../../errors';
import {encodeToBase64} from '../../internal/utils';

export abstract class Response extends ResponseBase {}

class _Success extends Response {
  readonly apiToken: string;
  readonly refreshToken: string;
  readonly endpoint: string;
  readonly validUntil: number;

  constructor(
    apiToken: string,
    refreshToken: string,
    endpoint: string,
    validUntil: number
  ) {
    super();
    this.apiToken = apiToken;
    this.refreshToken = refreshToken;
    this.endpoint = endpoint;
    this.validUntil = validUntil;
  }

  public getApiToken() {
    return encodeToBase64(
      JSON.stringify({endpoint: this.endpoint, api_key: this.apiToken})
    );
  }

  public getRefreshToken() {
    return this.refreshToken;
  }

  public getValidUntil() {
    return this.validUntil;
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
