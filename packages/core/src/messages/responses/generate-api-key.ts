import {BaseResponseSuccess, BaseResponseError} from './response-base';
import {GenerateApiKeyResponse} from './enums';
import {SdkError} from '../../errors';
import {encodeToBase64} from '../../internal/utils';
import {ExpiresAt} from '../../utils';

interface IResponse {
  readonly type: GenerateApiKeyResponse;
}

export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: GenerateApiKeyResponse.Success =
    GenerateApiKeyResponse.Success;

  readonly apiKey: string;
  readonly refreshToken: string;
  readonly endpoint: string;
  readonly expiresAt: ExpiresAt;

  /**
   * @deprecated Use `apiKey` instead.
   */
  get authToken(): string {
    return this.apiKey;
  }

  constructor(
    apiKey: string,
    refreshToken: string,
    endpoint: string,
    expiresAt: ExpiresAt
  ) {
    super();
    this.apiKey = encodeToBase64(
      JSON.stringify({endpoint: endpoint, api_key: apiKey})
    );
    this.refreshToken = refreshToken;
    this.endpoint = endpoint;
    this.expiresAt = expiresAt;
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
export class Error extends BaseResponseError implements IResponse {
  constructor(innerException: SdkError) {
    super(innerException);
  }

  readonly type: GenerateApiKeyResponse.Error = GenerateApiKeyResponse.Error;
}

export type Response = Success | Error;
