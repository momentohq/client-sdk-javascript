import {SdkError} from '../../errors';
import {
  BaseResponseError,
  BaseResponseMiss,
  ResponseBase,
} from './response-base';
import {CacheItemGetTtlResponse} from './enums';

interface IResponse {
  value(): number | undefined;
  readonly type: CacheItemGetTtlResponse;
}

/**
 * Indicates a successful item get ttl request.
 */
export class Hit extends ResponseBase implements IResponse {
  readonly type: CacheItemGetTtlResponse.Hit = CacheItemGetTtlResponse.Hit;
  private readonly ttlMillis: number;

  constructor(itemTTLMillisRemaining: number) {
    super();
    this.ttlMillis = itemTTLMillisRemaining;
  }

  /**
   * Returns the remaining ttl in milliseconds for object stored at passed key.
   * @returns number
   */
  public value(): number {
    return this.ttlMillis;
  }

  /**
   * Returns the remaining ttl in milliseconds for object stored at passed key.
   * @returns number
   */
  public remainingTtlMillis(): number {
    return this.ttlMillis;
  }

  public override toString(): string {
    return `${super.toString()}: remaining ttl: ${this.ttlMillis}`;
  }
}

/**
 * Indicates that the requested item was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  readonly type: CacheItemGetTtlResponse.Miss = CacheItemGetTtlResponse.Miss;

  constructor() {
    super();
  }

  value(): undefined {
    return undefined;
  }
}

/**
 * Indicates that an error occurred during the item get ttl request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: CacheItemGetTtlResponse.Error = CacheItemGetTtlResponse.Error;

  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  value(): undefined {
    return undefined;
  }
}

export type Response = Hit | Miss | Error;
