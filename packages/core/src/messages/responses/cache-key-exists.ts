import {SdkError} from '../../errors';
import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {CacheKeyExistsResponse} from './enums';

interface IResponse {
  exists(): boolean | undefined;
  readonly type: CacheKeyExistsResponse;
}

/**
 * Indicates a successful key exists request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: CacheKeyExistsResponse.Success =
    CacheKeyExistsResponse.Success;

  private readonly _exists: boolean;

  constructor(exists: boolean[]) {
    super();
    this._exists = exists[0];
  }

  /**
   * Returns the boolean indicating whether the given key was found in the cache.
   * @returns {boolean}
   */
  public exists(): boolean {
    return this._exists;
  }

  public override toString(): string {
    return `${super.toString()}: exists: ${String(this._exists)}`;
  }
}

/**
 * Indicates that an error occurred during the key exists request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: CacheKeyExistsResponse.Error = CacheKeyExistsResponse.Error;

  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  exists(): undefined {
    return undefined;
  }
}

export type Response = Success | Error;
