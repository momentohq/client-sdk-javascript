import {SdkError} from '../../errors';
import {
  ResponseBase,
  ResponseError,
  ResponseMiss,
  ResponseSuccess,
} from './response-base';

/**
 * Parent response type for an increase TTL request.  The
 * response object is resolved to a type-safe object of one of
 * the following subtypes:
 *
 * - {Set}
 * - {Miss}
 * - {Error}
 *
 * `instanceof` type guards can be used to operate on the appropriate subtype.
 * @example
 * For example:
 * ```
 * if (response instanceof CacheIncreaseTtl.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CacheIncreaseTtl.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

class _Set extends Response {}

/**
 * Indicates a successful increase TTL request.
 */
export class Set extends ResponseSuccess(_Set) {}

class _Miss extends Response {}

/**
 * Indicates a successful increase TTL request.
 */
export class Miss extends ResponseMiss(_Miss) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the increase TTL request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
