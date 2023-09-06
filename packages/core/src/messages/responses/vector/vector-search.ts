import {SdkError} from '../../../errors';
import {ResponseBase, ResponseError, ResponseSuccess} from '../response-base';

export interface SearchHit {
  id: string;
  distance: number;
  metadata: Record<string, string>;
}

/**
 * Parent response type for a VectorSearch request.  The
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
 * if (response instanceof VectorSearch.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `VectorSearch.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {
  hits(): Array<SearchHit> | undefined {
    if (this instanceof Success) {
      return this.hits();
    }
    return undefined;
  }
}

class _Success extends Response {}

/**
 * Indicates a Successful VectorSearch request.
 */
export class Success extends ResponseSuccess(_Success) {
  private readonly _hits: Array<SearchHit>;
  constructor(hits: Array<SearchHit>) {
    super();
    this._hits = hits;
  }
  hits(): Array<SearchHit> {
    return this._hits;
  }
}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the VectorSearch request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
