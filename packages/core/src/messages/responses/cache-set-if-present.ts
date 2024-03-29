import {SdkError} from '../../errors';
import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';

/**
 * Parent response type for a cache setIfPresent request.  The
 * response object is resolved to a type-safe object of one of
 * the following subtypes:
 *
 * - {Stored}
 * - {NotStored}
 * - {Error}
 *
 * `instanceof` type guards can be used to operate on the appropriate subtype.
 * @example
 * For example:
 * ```
 * if (response instanceof CacheSetIfPresent.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CacheSetIfPresent.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

class _Stored extends Response {}

/**
 * Indicates the key did not exist and the value was set.
 */
export class Stored extends ResponseSuccess(_Stored) {}

class _NotStored extends Response {}

/**
 * Indicates the key existed and no value was set.
 */
export class NotStored extends ResponseSuccess(_NotStored) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the cache setIfPresent request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
