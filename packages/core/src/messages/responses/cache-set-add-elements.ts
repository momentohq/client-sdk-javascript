import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';
import {SdkError} from '../../errors';
import * as CacheSetAddElement from './cache-set-add-element';

/**
 * Parent response type for a set add elements request.  The
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
 * if (response instanceof CacheSetAddElements.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CacheSetAddElements.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {
  abstract toSingularResponse(): CacheSetAddElement.Response;
}

class _Success extends Response {
  toSingularResponse(): CacheSetAddElement.Response {
    return new CacheSetAddElement.Success();
  }
}

/**
 * Indicates a Successful set add elements request.
 */
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(public _innerException: SdkError) {
    super();
  }

  toSingularResponse(): CacheSetAddElement.Response {
    return new CacheSetAddElement.Error(this._innerException);
  }
}

/**
 * Indicates that an error occurred during the set add elements request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
