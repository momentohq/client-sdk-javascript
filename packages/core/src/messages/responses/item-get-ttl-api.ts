import {SdkError} from '../../errors';
import {
  ResponseBase,
  ResponseError,
  ResponseHit,
  ResponseMiss,
} from './response-base';

/**
 * Parent response type for a item ttl request.  The
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
 * if (response instanceof ItemGetTtl.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `ItemGetTtl.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */

export abstract class Response extends ResponseBase {}

class _Hit extends Response {
  private readonly remainingTtlMillis: number;

  constructor(itemTTLMillisRemaining: number) {
    super();
    this.remainingTtlMillis = itemTTLMillisRemaining;
  }

  /**
   * Returns the remaining ttl in milliseconds for object stored at passed key.
   * @returns string
   */
  public itemTtlMillis(): number {
    return this.remainingTtlMillis;
  }
}

/**
 * Indicates that the key exists.
 */
export class Hit extends ResponseHit(_Hit) {}

class _Miss extends Response {}

/**
 * Indicates that the requested key was not available in the cache.
 */
export class Miss extends ResponseMiss(_Miss) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the item ttl request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
