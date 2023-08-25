import {SdkError} from '../../errors';
import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';

/**
 * Parent response type for a sorted set IncrementScore request.  The
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
 * if (response instanceof CacheSortedSetIncrementScore.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CacheSortedSetIncrementScore.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {
  public score(): number | undefined {
    if (this instanceof Success) {
      return (this as Success).score();
    }
    return undefined;
  }
}

class _Success extends Response {
  private readonly _score: number;

  constructor(score: number) {
    super();
    this._score = score;
  }

  /**
   * The new score of the element after incrementing.
   * @returns {number}
   */
  public score(): number {
    return this._score;
  }

  public override toString(): string {
    return `${super.toString()}: value: ${this.score()}`;
  }
}

/**
 * Indicates a Successful sorted set IncrementScore request.
 */
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the sorted set IncrementScore request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
