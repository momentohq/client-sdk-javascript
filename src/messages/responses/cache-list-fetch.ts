import {SdkError} from '../../errors/errors';
import {
  ResponseBase,
  ResponseError,
  ResponseHit,
  ResponseMiss,
} from './response-base';
import {TextDecoder} from 'util';
import {truncateStringArray} from '../../internal/utils/display';

const TEXT_DECODER = new TextDecoder();

/**
 * Parent response type for a cache delete request.  The
 * response object is resolved to a type-safe object of one of
 * the following subtypes:
 *
 * - CacheDelete.Success
 * - CacheDelete.Error
 *
 * `instanceof` type guards can be used to operate on the appropriate subtype.
 * @example
 * For example:
 * ```
 * if (response instanceof CacheDelete.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CacheDelete.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

class _Hit extends Response {
  private readonly _values: Uint8Array[];
  constructor(values: Uint8Array[]) {
    super();
    this._values = values;
  }

  public valueListUint8Array(): Uint8Array[] {
    return this._values;
  }

  public valueListString(): string[] {
    return this._values.map(v => TEXT_DECODER.decode(v));
  }

  public valueList(): string[] {
    return this.valueListString();
  }

  public override toString(): string {
    const truncatedStringArray = truncateStringArray(this.valueListString());
    return `${super.toString()}: [${truncatedStringArray.toString()}]`;
  }
}
export class Hit extends ResponseHit(_Hit) {}

class _Miss extends Response {}
export class Miss extends ResponseMiss(_Miss) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the cache delete request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
