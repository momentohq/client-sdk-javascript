import {SdkError} from '../../errors';
import {
  BaseResponseError,
  BaseResponseMiss,
  ResponseBase,
} from './response-base';
import {CacheUpdateTtlResponse} from './enums';

interface IResponse {
  readonly type: CacheUpdateTtlResponse;
}

/**
 * Indicates the ttl was successfully overwritten.
 */
export class Set extends ResponseBase implements IResponse {
  readonly type: CacheUpdateTtlResponse.Set = CacheUpdateTtlResponse.Set;
}

/**
 * Indicates the requested item was not found in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  readonly type: CacheUpdateTtlResponse.Miss = CacheUpdateTtlResponse.Miss;
}

/**
 * Indicates that an error occurred during the update ttl request.
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

  readonly type: CacheUpdateTtlResponse.Error = CacheUpdateTtlResponse.Error;
}

export type Response = Set | Miss | Error;
