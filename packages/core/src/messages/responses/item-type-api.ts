import {SdkError} from '../../errors/errors';
import {
  ResponseBase,
  ResponseError,
  ResponseHit,
  ResponseMiss,
} from './response-base';
import {cache_client} from '@gomomento/generated-types/dist/cacheclient';
import _ItemGetTypeResponse = cache_client._ItemGetTypeResponse;

/**
 * Parent response type for a item type request.  The
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
 * if (response instanceof ItemType.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `ItemType.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */

export abstract class Response extends ResponseBase {}

class _Hit extends Response {
  private readonly keyType: _ItemGetTypeResponse.ItemType;

  constructor(keyType: _ItemGetTypeResponse.ItemType) {
    super();
    this.keyType = keyType;
  }

  /**
   * Returns the type of key.
   * @returns string
   */
  public getItemType(): _ItemGetTypeResponse.ItemType {
    return this.keyType;
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
 * Indicates that an error occurred during the item type request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
