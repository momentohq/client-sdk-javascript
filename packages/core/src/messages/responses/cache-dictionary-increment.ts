import {SdkError} from '../../errors';
import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';

/**
 * Parent response type for a dictionary increment request.  The
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
 * if (response instanceof CacheDictionaryIncrement.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CacheDictionaryIncrement.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {
  public value(): number | undefined {
    if (this instanceof Success) {
      return (this as Success).value();
    }
    return undefined;
  }
}

class _Success extends Response {
  private readonly _value: number;

  constructor(value: number) {
    super();
    this._value = value;
  }

  /**
   * The new value of the element after incrementing.
   * @returns {number}
   */
  public value(): number {
    return this._value;
  }
  public valueNumber(): number {
    return this._value;
  }

  public override toString(): string {
    return `${super.toString()}: value: ${this.valueNumber()}`;
  }
}

/**
 * Indicates a Successful dictionary increment request.
 */
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the dictionary increment request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
