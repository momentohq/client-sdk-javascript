import {SdkError} from '../../errors';
import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {ListCachesResponse} from './enums';
import {CacheInfo} from '../..';

interface IResponse {
  readonly type: ListCachesResponse;
}

/**
 * Indicates a successful list caches request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: ListCachesResponse.Success = ListCachesResponse.Success;
  private readonly caches: CacheInfo[];

  constructor(caches: CacheInfo[]) {
    super();
    this.caches = caches;
  }

  /**
   * An array of CacheInfo, containing information about each cache.
   * @returns {CacheInfo[]}
   */
  public getCaches() {
    return this.caches;
  }

  public override toString() {
    const caches = this.caches.map(cacheInfo => cacheInfo.getName());
    return super.toString() + ': ' + caches.join(', ');
  }
}

/**
 * Indicates that an error occurred during the list caches request.
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

  readonly type: ListCachesResponse.Error = ListCachesResponse.Error;
}

export type Response = Success | Error;
