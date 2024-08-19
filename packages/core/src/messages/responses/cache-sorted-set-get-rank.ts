import {
  ResponseBase,
  BaseResponseError,
  BaseResponseMiss,
} from './response-base';
import {CacheSortedSetGetRankResponse} from './enums';
import {SdkError} from '../../errors';

interface IResponse {
  rank(): number | undefined;
  readonly type: CacheSortedSetGetRankResponse;
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `rank()` accessor to retrieve rank.
 */
export class Hit extends ResponseBase implements IResponse {
  private readonly _rank: number;
  readonly type: CacheSortedSetGetRankResponse.Hit =
    CacheSortedSetGetRankResponse.Hit;

  constructor(rank: number) {
    super();
    this._rank = rank;
  }

  /**
   * Returns the rank of the element in the sorted set.  Ranks start at 0.
   * @returns {number}
   */
  public rank(): number {
    return this._rank;
  }

  public override toString(): string {
    return `${super.toString()}: rank: ${this.rank()}`;
  }
}

/**
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  readonly type: CacheSortedSetGetRankResponse.Miss =
    CacheSortedSetGetRankResponse.Miss;

  constructor() {
    super();
  }

  public rank(): undefined {
    return;
  }
}

/**
 * Indicates that an error occurred during the sorted set get rank request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: CacheSortedSetGetRankResponse.Error =
    CacheSortedSetGetRankResponse.Error;

  constructor(error: SdkError) {
    super(error);
  }

  public rank(): undefined {
    return;
  }
}

export type Response = Hit | Miss | Error;
