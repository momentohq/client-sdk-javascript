import {SdkError} from '../../errors';
import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';

/**
 * Parent response type for a cache key exists request. The
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
 * if (response instanceof CacheKeyExists.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CacheKeyExists.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

class _Success extends Response {
  private readonly _exists: boolean;

  constructor(exists: boolean[]) {
    super();
    this._exists = exists[0];
  }

  /**
   * The boolean indicating whether the given key was found in the cache.
   * @returns {boolean}
   */
  public exists(): boolean {
    return this._exists;
  }

  public override toString(): string {
    return `${super.toString()}: exists: ${String(this.exists())}`;
  }
}

/**
 * Indicates a Successful cache key exists request.
 */
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the cache key exists request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
