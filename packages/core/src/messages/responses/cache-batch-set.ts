import {SdkError} from '../../errors';
import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {CacheSetBatchResponse} from './enums';
import {CacheSet} from '../..';

interface IResponse {
  readonly type: CacheSetBatchResponse;
}

/**
 * Indicates a successful cache set batch request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: CacheSetBatchResponse.Success = CacheSetBatchResponse.Success;
  private readonly body: CacheSet.Response[];

  constructor(body: CacheSet.Response[]) {
    super();
    this.body = body;
  }

  /**
   * Returns the status for each request in the batch as a list of CacheGet.Response objects.
   * @returns {CacheSet.Response[]}
   */
  public results(): CacheSet.Response[] {
    return this.body;
  }
}

/**
 * Indicates that an error occurred during the cache set batch request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  readonly type: CacheSetBatchResponse.Error = CacheSetBatchResponse.Error;
}

export type Response = Success | Error;
