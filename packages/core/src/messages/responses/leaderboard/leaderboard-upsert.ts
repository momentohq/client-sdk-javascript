import {SdkError} from '../../../errors';
import {BaseResponseError, BaseResponseSuccess} from '../response-base';
import {LeaderboardUpsertResponse} from '../enums';

interface IResponse {
  type: LeaderboardUpsertResponse;
}

/**
 * Indicates a Successful leaderboard length request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: LeaderboardUpsertResponse.Success =
    LeaderboardUpsertResponse.Success;
}

/**
 * Indicates that an error occurred during the leaderboard upsert request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: LeaderboardUpsertResponse.Error =
    LeaderboardUpsertResponse.Error;

  constructor(_innerException: SdkError) {
    super(_innerException);
  }
}

export type Response = Success | Error;
