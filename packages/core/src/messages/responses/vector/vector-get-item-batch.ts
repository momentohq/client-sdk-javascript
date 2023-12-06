import {SdkError} from '../../../errors';
import {VectorIndexItem} from '../../vector-index';
import {ResponseBase, ResponseError, ResponseSuccess} from '../response-base';

/**
 * Parent response type for a VectorGetItemBatch request.  The
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
 * if (response instanceof VectorGetItemBatch.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `VectorGetItemBatch.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {
  hits(): Record<string, VectorIndexItem> | undefined {
    if (this instanceof Success) {
      return this.hits();
    }
    return undefined;
  }
}

class _Success extends Response {}

/**
 * Indicates a Successful VectorGetItemBatch request.
 */
export class Success extends ResponseSuccess(_Success) {
  private readonly _hits: Record<string, VectorIndexItem>;
  constructor(hits: Record<string, VectorIndexItem>) {
    super();
    this._hits = hits;
  }
  /**
   * Returns the found items from the VectorGetItemBatch request.
   *
   * Items that were not found will not be included in the
   * returned object.
   * @returns {Record<string, VectorIndexItem>} The items that were found in the index.
   */
  hits(): Record<string, VectorIndexItem> {
    return this._hits;
  }
}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the VectorGetItemBatch request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
