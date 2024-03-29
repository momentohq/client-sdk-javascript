import {SigningKey} from '../signing-key';
import {SdkError} from '../../errors';
import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';
import {_SigningKey} from './grpc-response-types';

/**
 * Parent response type for a list signing keys request.  The
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
 * if (response instanceof ListSigningKeys.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `ListSigningKeys.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

class _Success extends Response {
  private readonly nextToken?: string;
  private readonly signingKeys: SigningKey[];

  constructor(
    endpoint: string,
    signingKeys: _SigningKey[],
    nextToken?: string
  ) {
    super();
    this.nextToken = nextToken;
    this.signingKeys =
      signingKeys.map(
        signingKey =>
          new SigningKey(
            signingKey.key,
            new Date(signingKey.expiresAt * 1000),
            endpoint
          )
      ) ?? [];
  }

  public getNextToken() {
    return this.nextToken;
  }

  public getSigningKeys() {
    return this.signingKeys;
  }
}

/**
 * Indicates a Successful list signing keys request.
 */
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the list signing keys request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
