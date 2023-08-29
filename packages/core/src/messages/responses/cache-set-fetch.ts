import {
  ResponseBase,
  ResponseError,
  ResponseMiss,
  ResponseHit,
} from './response-base';
import {SdkError} from '../../errors';
import {truncateStringArray} from '../../internal/utils';

const TEXT_DECODER = new TextDecoder();

/**
 * Parent response type for a set fetch request.  The
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
 * if (response instanceof CacheSetFetch.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CacheSetFetch.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {
  public value(): string[] | undefined {
    if (this instanceof Hit) {
      return (this as Hit).value();
    }
    return undefined;
  }
}

class _Hit extends Response {
  private readonly elements: Uint8Array[];

  constructor(elements: Uint8Array[]) {
    super();
    this.elements = elements;
  }

  /**
   * Returns the data as a Set whose values are utf-8 strings, decoded from the underlying byte arrays.  This
   * is a convenience alias for {valueSetString}.
   * @returns {Set<string>}
   */
  public valueSet(): Set<string> {
    return this.valueSetString();
  }

  /**
   * Returns the data as a Set whose values are utf-8 strings, decoded from the underlying byte arrays.
   * @returns {Set<string>}
   */
  public valueSetString(): Set<string> {
    return new Set(this.elements.map(e => TEXT_DECODER.decode(e)));
  }

  /**
   * Returns the data as a Set whose values are byte arrays.
   * @returns {Set<Uint8Array>}
   */
  public valueSetUint8Array(): Set<Uint8Array> {
    return new Set(this.elements);
  }

  /**
   * Returns the data as an Array whose values are utf-8 strings, decoded from the underlying byte arrays.
   * This accessor is provided because Arrays are sometimes easier to work with in TypeScript/JavaScript than Sets are.
   * This is a convenience alias for {valueArrayString}.
   * @returns {string[]}
   */
  public value(): string[] {
    return this.valueArrayString();
  }

  /**
   * Returns the data as an Array whose values are utf-8 strings, decoded from the underlying byte arrays.
   * This accessor is provided because Arrays are sometimes easier to work with in TypeScript/JavaScript than Sets are.
   * This is a convenience alias for {valueArrayString}.
   * @returns {string[]}
   */
  public valueArray(): string[] {
    return this.valueArrayString();
  }

  /**
   * Returns the data as an Array whose values are utf-8 strings, decoded from the underlying byte arrays.
   * This accessor is provided because Arrays are sometimes easier to work with in TypeScript/JavaScript than Sets are.
   * @returns {string[]}
   */
  public valueArrayString(): string[] {
    return this.elements.map(e => TEXT_DECODER.decode(e));
  }

  /**
   * Returns the data as an Array whose values are byte arrays.
   * This accessor is provided because Arrays are sometimes easier to work with in TypeScript/JavaScript than Sets are.
   * @returns {Uint8Array[]}
   */
  public valueArrayUint8Array(): Uint8Array[] {
    return this.elements;
  }

  public override toString(): string {
    const truncatedStringArray = truncateStringArray(
      Array.from(this.valueSetString())
    );
    return `${super.toString()}: [${truncatedStringArray.toString()}]`;
  }
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `value*` accessors to retrieve the data in the appropriate format.
 */
export class Hit extends ResponseHit(_Hit) {}

class _Miss extends Response {}

/**
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends ResponseMiss(_Miss) {}

class _Error extends Response {
  constructor(public _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the set fetch request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
