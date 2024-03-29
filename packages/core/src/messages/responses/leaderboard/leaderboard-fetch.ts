import {SdkError} from '../../../errors';
import {_RankedElement} from '../grpc-response-types';
import {ResponseBase, ResponseError, ResponseSuccess} from '../response-base';

/**
 * Parent response type for a leaderboard fetch by rank or by score request.  The
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
 * if (response instanceof LeaderboardFetchByScore.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `LeaderboardFetchByScore.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

class _Success extends Response {
  private readonly _elements: _RankedElement[];

  constructor(elements: _RankedElement[]) {
    super();
    this._elements = elements;
  }

  /**
   * Returns the elements as an array of objects, each containing an `id`, `score`, and `rank` field.
   * @returns {{id: number, score: number, rank: number}[]}
   */
  public values(): {id: number; score: number; rank: number}[] {
    return this._elements.map(item => {
      return {
        id: item.id,
        score: item.score,
        rank: item.rank,
      };
    });
  }
}

/**
 * Indicates a Successful leaderboard fetch request.
 */
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the leaderboard fetch by rank or by score request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
