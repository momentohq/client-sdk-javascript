import {SdkError} from '../../../errors';
import {_RankedElement} from '../grpc-response-types';
import {BaseResponseError, BaseResponseSuccess} from '../response-base';
import {LeaderboardFetchResponse} from '../enums';

interface IResponse {
  readonly type: LeaderboardFetchResponse;
}

/**
 * Indicates a Successful leaderboard fetch request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: LeaderboardFetchResponse.Success =
    LeaderboardFetchResponse.Success;
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
 * Indicates that an error occurred during the leaderboard fetch by rank or by score request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: LeaderboardFetchResponse.Error =
    LeaderboardFetchResponse.Error;

  constructor(_innerException: SdkError) {
    super(_innerException);
  }
}

export type Response = Success | Error;
