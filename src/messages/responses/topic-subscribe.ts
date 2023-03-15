// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {SdkError} from '../../errors/errors';
import {ResponseBase, ResponseError} from './response-base';
import {truncateString} from '../../internal/utils/display';

/**
 * Parent response type for a cache get request.  The
 * response object is resolved to a type-safe object of one of
 * the following subtypes:
 *
 * - {Hit}
 * - {Miss}
 * - {Error}
 *
 * `instanceof` type guards can be used to operate on the appropriate subtype.
 * @example
 * For example:
 * ```
 * if (response instanceof CacheGet.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CacheGet.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

export class Item extends Response {
  private readonly _value: string | Uint8Array;
  constructor(_value: string | Uint8Array) {
    super();
    this._value = _value;
  }
  /**
   * Returns the data as a utf-8 string, decoded from the underlying byte array.
   * @returns string
   */
  public value(): string | Uint8Array {
    return this._value;
  }

  public override toString(): string {
    const display = truncateString(this.value().toString());
    return `${super.toString()}: ${display}`;
  }
}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the cache get request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
