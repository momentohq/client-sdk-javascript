import {
  IListResponseSuccess,
  ResponseBase,
  ResponseError,
  ResponseSuccess,
} from './response-base';
import {SdkError} from '../../errors/errors';

/**
 * Parent response type for a cache delete request.  The
 * response object is resolved to a type-safe object of one of
 * the following subtypes:
 *
 * - CacheDelete.Success
 * - CacheDelete.Error
 *
 * `instanceof` type guards can be used to operate on the appropriate subtype.
 * @example
 * For example:
 * ```
 * if (response instanceof CacheDelete.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CacheDelete.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

class _Success extends Response implements IListResponseSuccess {
  private readonly _list_length: number;
  constructor(list_length: number) {
    super();
    this._list_length = list_length;
  }

  /**
   * Returns the new length of the list after the push operation.
   * @returns {number}
   */
  public listLength(): number {
    return this._list_length;
  }

  public override toString(): string {
    return `${super.toString()}: listLength: ${this._list_length}`;
  }
}

/**
 * Indicates a Successful cache delete request.
 */
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {}

/**
 * Indicates that an error occurred during the cache delete request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {
  constructor(public _innerException: SdkError) {
    super();
  }
}
