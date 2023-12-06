import {SdkError} from '../../../errors';
import {VectorIndexMetadata} from '../../..';
import {ResponseBase, ResponseError, ResponseSuccess} from '../response-base';

/**
 * Parent response type for a VectorGetItemMetadataBatch request. The
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
 * if (response instanceof VectorGetItemMetadataBatch.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `VectorGetItemMetadataBatch.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {
  values(): Record<string, VectorIndexMetadata> | undefined {
    if (this instanceof Success) {
      return this.values();
    }
    return undefined;
  }
}

class _Success extends Response {}

/**
 * Indicates a Successful VectorGetItemMetadataBatch request.
 */
export class Success extends ResponseSuccess(_Success) {
  private readonly _values: Record<string, VectorIndexMetadata>;
  constructor(values: Record<string, VectorIndexMetadata>) {
    super();
    this._values = values;
  }
  /**
   * Returns the metadat for the found items from the VectorGetItemMetadataBatch request.
   *
   * Items that were not found will not be included in the
   * returned object.
   * @returns {Record<string, VectorIndexMetadata>} The metadata for items found in the index.
   */
  hits(): Record<string, VectorIndexMetadata> {
    return this._values;
  }
}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the VectorGetItemMetadataBatch request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
