import {SdkError} from '../../../errors';
import {ResponseBase, ResponseError, ResponseSuccess} from '../response-base';

/**
 * Parent response type for a create index request.  The
 * response object is resolved to a type-safe object of one of
 * the following subtypes:
 *
 * - {Success}
 * - {AlreadyExists}
 * - {Error}
 *
 * `instanceof` type guards can be used to operate on the appropriate subtype.
 * @example
 * For example:
 * ```
 * if (response instanceof CreateIndex.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CreateIndex.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

class _Success extends Response {}

/**
 * Indicates a Successful create index request.
 */
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the create index request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}

/**
 * Indicates that the index already exists, so there was nothing to do.
 */
export class AlreadyExists extends Response {}
