import {SdkError} from '../../errors';
import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';
import {CacheGet} from '../..';

const TEXT_DECODER = new TextDecoder();

/**
 * Parent response type for a cache get batch request.  The
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
 * if (response instanceof BatchGet.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `BatchGet.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {
  public values(): Record<string, string> | undefined {
    if (this instanceof Success) {
      return (this as Success).values();
    }
    return undefined;
  }

  public results(): CacheGet.Response[] | undefined {
    if (this instanceof Success) {
      return (this as Success).results();
    }
    return undefined;
  }
}

class _Success extends Response {
  private readonly items: CacheGet.Response[];
  private readonly keys: Uint8Array[];

  constructor(items: CacheGet.Response[], keys: Uint8Array[]) {
    super();
    this.items = items;
    this.keys = keys;
  }

  /**
   * Returns the status for each request in the batch as a list of CacheGet.Response objects.
   * @returns {CacheGet.Response[]}
   */
  public results(): CacheGet.Response[] {
    return this.items;
  }

  /**
   * Returns the data as a Record whose keys and values are utf-8 strings, decoded from the underlying byte arrays.
   * This can be used in most places where an Object is desired.  This is a convenience alias for
   * {valueRecordStringString}.
   * @returns {Record<string, string>}
   */
  public values(): Record<string, string> {
    return this.valuesRecordStringString();
  }

  /**
   * Returns the data as a Record whose keys and values are utf-8 strings, decoded from the underlying byte arrays.
   * This can be used in most places where an Object is desired.  This is a convenience alias for
   * {valueRecordStringString}.
   * @returns {Record<string, string>}
   */
  public valuesRecord(): Record<string, string> {
    return this.valuesRecordStringString();
  }

  /**
   * Returns the data as a Record whose keys and values are utf-8 strings, decoded from the underlying byte arrays.
   * This can be used in most places where an Object is desired.
   * @returns {Record<string, string>}
   */
  public valuesRecordStringString(): Record<string, string> {
    return this.items.reduce<Record<string, string>>((acc, item, index) => {
      if (item instanceof CacheGet.Hit) {
        acc[TEXT_DECODER.decode(this.keys[index])] = item.valueString();
      }
      return acc;
    }, {});
  }

  /**
   * Returns the data as a Record whose keys are utf-8 strings, decoded from the underlying byte array, and whose
   * values are byte arrays.  This can be used in most places where an Object is desired.
   * @returns {Record<string, Uint8Array>}
   */
  public valuesRecordStringUint8Array(): Record<string, Uint8Array> {
    return this.items.reduce<Record<string, Uint8Array>>((acc, item, index) => {
      if (item instanceof CacheGet.Hit) {
        acc[TEXT_DECODER.decode(this.keys[index])] = item.valueUint8Array();
      }
      return acc;
    }, {});
  }

  /**
   * Returns the data as a Map whose keys and values are utf-8 strings, decoded from the underlying byte arrays.
   * This is a convenience alias for {valueMapStringString}.
   * @returns {Map<string, string>}
   */
  public valuesMap(): Map<string, string> {
    return this.valuesMapStringString();
  }

  /**
   * Returns the data as a Map whose keys and values are utf-8 strings, decoded from the underlying byte arrays.
   * @returns {Map<string, string>}
   */
  public valuesMapStringString(): Map<string, string> {
    return this.items.reduce((acc, item, index) => {
      if (item instanceof CacheGet.Hit) {
        acc.set(TEXT_DECODER.decode(this.keys[index]), item.valueString());
      }
      return acc;
    }, new Map<string, string>());
  }

  /**
   * Returns the data as a Map whose keys are strings and whose values are byte arrays.
   * @returns {Map<string, Uint8Array>}
   */
  public valuesMapStringUint8Array(): Map<string, Uint8Array> {
    return this.items.reduce((acc, item, index) => {
      if (item instanceof CacheGet.Hit) {
        acc.set(TEXT_DECODER.decode(this.keys[index]), item.valueUint8Array());
      }
      return acc;
    }, new Map<string, Uint8Array>());
  }

  public override toString(): string {
    const display = this.results()
      .map(result => result.toString())
      .toString();
    return `${super.toString()}: ${display}`;
  }
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `value*` accessors to retrieve the data in the appropriate format.
 */
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the cache get request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
