import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {CacheSortedSetIncrementScoreResponse} from './enums';
import {SdkError} from '../../errors';

interface IResponse {
  score(): number | undefined;
  readonly type: CacheSortedSetIncrementScoreResponse;
}

/**
 * Indicates a Successful sorted set IncrementScore request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  private readonly _score: number;
  readonly type: CacheSortedSetIncrementScoreResponse.Success =
    CacheSortedSetIncrementScoreResponse.Success;

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
 * Indicates that an error occurred during the sorted set IncrementScore request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: CacheSortedSetIncrementScoreResponse.Error =
    CacheSortedSetIncrementScoreResponse.Error;

  constructor(error: SdkError) {
    super(error);
  }

  public score(): undefined {
    return undefined;
  }
}

export type Response = Success | Error;
