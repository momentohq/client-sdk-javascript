import {SdkError} from '../../../errors';
import {
  ResponseBase,
  ResponseError,
  ResponseFound,
  ResponseNotFound,
} from '../response-base';

/**
 * Parent response type for a leaderboard get element rank request.  The
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
 * if (response instanceof LeaderboardGetRank.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `LeaderboardGetRank.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

class _Found extends Response {
  private readonly _id: bigint;
  private readonly _rank: bigint;
  private readonly _score: number;
  constructor(id: bigint, rank: bigint, score: number) {
    super();
    this._id = id;
    this._rank = rank;
    this._score = score;
  }

  /**
   * Returns the id of the requested element in the leaderboard
   * @returns {bigint}
   */
  public id(): bigint {
    return this._id;
  }

  /**
   * Returns the rank of the requested element in the leaderboard
   * @returns {bigint}
   */
  public rank(): bigint {
    return this._rank;
  }

  /**
   * Returns the score of the requested element in the leaderboard
   * @returns {number}
   */
  public score(): number {
    return this._score;
  }

  public override toString(): string {
    return `${super.toString()}: get element rank ${this._rank}`;
  }
}

/**
 * Indicates a Successful leaderboard get element rank request.
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
 * Indicates that an error occurred during the leaderboard get element rank request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
