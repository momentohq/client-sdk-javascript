import {SdkError} from '../../../errors';
import {BaseResponseError, BaseResponseSuccess} from '../response-base';
import {LeaderboardLengthResponse} from '../enums';

interface IResponse {
  type: LeaderboardLengthResponse;
}

/**
 * Indicates a successful leaderboard length request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: LeaderboardLengthResponse.Success =
    LeaderboardLengthResponse.Success;
  private readonly _length: number;

  constructor(length: number) {
    super();
    this._length = length;
  }

  /**
   * Returns the length of the leaderboard
   * @returns {number}
   */
  public length(): number {
    return this._length;
  }

  public override toString(): string {
    return `${super.toString()}: length ${this._length}`;
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
export class Error extends BaseResponseError implements IResponse {
  readonly type: LeaderboardLengthResponse.Error =
    LeaderboardLengthResponse.Error;

  constructor(_innerException: SdkError) {
    super(_innerException);
  }
}

export type Response = Success | Error;
