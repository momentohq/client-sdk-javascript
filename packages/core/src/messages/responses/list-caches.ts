import {CacheInfo} from '../cache-info';
import {SdkError} from '../../errors';
import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';

/**
 * Parent response type for a list caches request.  The
 * response object is resolved to a type-safe object of one of
 * the following subtypes:
 *
 * - {Success}
 * - {Error}
 *
 * `instanceof` type guards can be used to operate on the appropriate subtype.
 * @example
 * For example:
 * ```
 * if (response instanceof ListCaches.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `ListCaches.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

class _Success extends Response {
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
 * Indicates a Successful list caches request.
 */
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
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
export class Error extends ResponseError(_Error) {}
