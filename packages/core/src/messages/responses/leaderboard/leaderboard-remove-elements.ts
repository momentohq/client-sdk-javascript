import {SdkError} from '../../../errors';
import {BaseResponseError, BaseResponseSuccess} from '../response-base';
import {LeaderboardRemoveElementsResponse} from '../enums';

interface IResponse {
  type: LeaderboardRemoveElementsResponse;
}

/**
 * Indicates a Successful leaderboard remove elements request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: LeaderboardRemoveElementsResponse.Success =
    LeaderboardRemoveElementsResponse.Success;
}
/**
 * Indicates that an error occurred during the leaderboard remove elements request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: LeaderboardRemoveElementsResponse.Error =
    LeaderboardRemoveElementsResponse.Error;

  constructor(_innerException: SdkError) {
    super(_innerException);
  }
}

export type Response = Success | Error;
