import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';
import {_GenerateApiTokenResponse} from './grpc-response-types';
import {SdkError} from '../../errors';

export abstract class Response extends ResponseBase {}

class _Success extends Response {
  readonly apiToken: string;
  readonly refreshToken: string;
  readonly endpoint: string;
  readonly validUntil: number;

  constructor(result: _GenerateApiTokenResponse) {
    super();
    if (result) {
      this.apiToken = result.apiToken;
      this.refreshToken = result.refreshToken;
      this.endpoint = result.endpoint;
      this.validUntil = result.validUntil;
    }
  }

  public getApiToken() {
    return this.apiToken;
  }

  public getRefreshToken() {
    return this.refreshToken;
  }

  public getEndpoint() {
    return this.endpoint;
  }

  public getValidUntil() {
    return this.validUntil;
  }
}

/**
 * Indicates a Successful list caches request.
 */
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the list caches request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
