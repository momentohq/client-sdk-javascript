import {SdkError} from '../../errors/errors';
import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';

/**
 * Parent response type for a create signing key request.  The
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
 * if (response instanceof CreateSigningKey.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CreateSigningKey.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

export class _SigningKey {
  readonly key: string;
  readonly expiresAt: number;
  constructor(key?: string, expiresAt?: number) {
    this.key = key ?? '';
    this.expiresAt = expiresAt ?? 0;
  }
}

class _Success extends Response {
  private readonly keyId: string;
  private readonly endpoint: string;
  private readonly key: string;
  private readonly expiresAt: Date;

  constructor(endpoint: string, result?: _SigningKey) {
    super();
    const key = result?.key ?? '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    this.keyId = JSON.parse(key)['kid'];
    this.endpoint = endpoint;
    this.key = key;
    this.expiresAt = new Date(result?.expiresAt ?? 0 * 1000);
  }

  public getKeyId(): string {
    return this.keyId;
  }

  public getEndpoint(): string {
    return this.endpoint;
  }

  public getKey(): string {
    return this.key;
  }

  public getExpiresAt(): Date {
    return this.expiresAt;
  }
}

/**
 * Indicates a Successful create signing key request.
 */
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the create signing key request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
