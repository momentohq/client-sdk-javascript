import {SdkError} from '../../errors';
import {
  BaseResponseError,
  BaseResponseMiss,
  ResponseBase,
} from './response-base';
import {CacheDecreaseTtlResponse} from './enums';

interface IResponse {
  readonly type: CacheDecreaseTtlResponse;
}

/**
 * Indicates the ttl was successfully decreased.
 */
export class Set extends ResponseBase implements IResponse {
  readonly type: CacheDecreaseTtlResponse.Set = CacheDecreaseTtlResponse.Set;
}

/**
 * Indicates the ttl was not updated due to a failed condition.
 */
export class NotSet extends ResponseBase implements IResponse {
  readonly type: CacheDecreaseTtlResponse.NotSet =
    CacheDecreaseTtlResponse.NotSet;
}

/**
 * Indicates the requested item was not found in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  readonly type: CacheDecreaseTtlResponse.Miss = CacheDecreaseTtlResponse.Miss;
}

/**
 * Indicates that an error occurred during the decrease ttl request.
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

  readonly type: CacheDecreaseTtlResponse.Error =
    CacheDecreaseTtlResponse.Error;
}

export type Response = Set | NotSet | Miss | Error;
