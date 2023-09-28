import {SdkError} from '../../../errors';
import {
  ResponseBase,
  ResponseError,
  ResponseFound,
  ResponseNotFound,
} from '../response-base';

/**
 * Parent response type for a leaderboard length request.  The
 * response object is resolved to a type-safe object of one of
 * the following subtypes:
 *
 * - {Found}
 * - {NotFound}
 * - {Error}
 *
 * `instanceof` type guards can be used to operate on the appropriate subtype.
 * @example
 * For example:
 * ```
 * if (response instanceof LeaderboardLength.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `LeaderboardLength.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

class _Found extends Response {
  private readonly _length: bigint;
  constructor(length: bigint) {
    super();
    this._length = length;
  }

  /**
   * Returns the length of the leaderboard
   * @returns {bigint}
   */
  public length(): bigint {
    return this._length;
  }

  public override toString(): string {
    return `${super.toString()}: length ${this._length}`;
  }
}

/**
 * Indicates a successful leaderboard length request.
 */
export class Found extends ResponseFound(_Found) {}

class _NotFound extends Response {}

/**
 * Indicates that the requested data was not available in the cache.
 */
export class NotFound extends ResponseNotFound(_NotFound) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the leaderboard length request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
