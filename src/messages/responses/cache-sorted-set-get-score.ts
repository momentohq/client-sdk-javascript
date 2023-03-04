import {
  ResponseBase,
  ResponseHit,
  ResponseMiss,
  ResponseError,
} from './response-base';
import {SdkError} from '../../errors/errors';

/**
 * Parent response type for a sorted set get score request.  The
 * response object is resolved to a type-safe object of one of
 * the following subtypes:
 *
 * - {Hit}
 * - {Miss}
 * - {Error}
 *
 * `instanceof` type guards can be used to operate on the appropriate subtype.
 * @example
 * For example:
 * ```
 * if (response instanceof CacheSortedSetGetScore.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CacheSortedSetGetScore.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

class _Hit extends Response {
  private readonly _score: number;

  constructor(score: number) {
    super();
    this._score = score;
  }

  /**
   * Returns the score of the element in the sorted set.
   * @returns {number}
   */
  public score(): number {
    return this._score;
  }

  public override toString(): string {
    return `${super.toString()}: score: ${this.score()}`;
  }
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `rank()` accessor to retrieve rank.
 */
export class Hit extends ResponseHit(_Hit) {}

class _Miss extends Response {}

/**
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends ResponseMiss(_Miss) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the sorted set get score request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
