import {CacheSet} from '../..';
import {SdkError} from '../../errors';
import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';

/**
 * Parent response type for a cache set batch request.  The
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
 * if (response instanceof SetBatch.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `SetBatch.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {
  public results(): CacheSet.Response[] | undefined {
    if (this instanceof Success) {
      return (this as Success).results();
    }
    return undefined;
  }
}

class _Success extends Response {
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
 * Indicates a Successful cache set request.
 */
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the cache set request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
