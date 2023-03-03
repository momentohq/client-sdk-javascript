import {
  ResponseBase,
  ResponseHit,
  ResponseMiss,
  ResponseError,
} from './response-base';
import {SdkError} from '../../errors/errors';
import {TextDecoder} from 'util';
import {cache_client} from '@gomomento/generated-types/dist/cacheclient';

const TEXT_DECODER = new TextDecoder();

/**
 * Parent response type for a sorted set fetch request.  The
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
 * if (response instanceof CacheSortedSetFetch.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CacheSortedSetFetch.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

class _Hit extends Response {
  private readonly items: cache_client._SortedSetElement[];
  private readonly _displayListSizeLimit = 5;

  constructor(items: cache_client._SortedSetElement[]) {
    super();
    this.items = items;
  }

  /**
   * Returns the data as a Map whose keys and values are utf-8 strings, decoded from the underlying byte arrays.
   * This is a convenience alias for {valueMapStringString}.
   * @returns {Map<string, number>}
   */
  public valueMap(): Map<string, number> {
    return this.valueMapStringNumber();
  }

  /**
   * Returns the data as a Map whose keys are byte arrays.
   * @returns {Map<Uint8Array, number>}
   */
  public valueMapUint8ArrayNumber(): Map<Uint8Array, number> {
    return this.items.reduce((acc, item) => {
      acc.set(item.value, item.score);
      return acc;
    }, new Map<Uint8Array, number>());
  }

  /**
   * Returns the data as a Map whose keys utf-8 strings, decoded from the underlying byte arrays.
   * @returns {Map<string, number>}
   */
  public valueMapStringNumber(): Map<string, number> {
    return this.items.reduce((acc, item) => {
      acc.set(TEXT_DECODER.decode(item.value), item.score);
      return acc;
    }, new Map<string, number>());
  }

  /**
   * Returns the data as a Record whose keys utf-8 strings, decoded from the underlying byte arrays.
   * This can be used in most places where an Object is desired.  This is a convenience alias for
   * {valueRecordStringString}.
   * @returns {Record<string, number>}
   */
  public valueRecord(): Record<string, number> {
    return this.valueRecordStringNumber();
  }

  /**
   * Returns the data as a Record whose keys are utf-8 strings, decoded from the underlying byte arrays.
   * This can be used in most places where an Object is desired.
   * @returns {Record<string, number>}
   */
  public valueRecordStringNumber(): Record<string, number> {
    return this.items.reduce<Record<string, number>>((acc, item) => {
      acc[TEXT_DECODER.decode(item.value)] = item.score;
      return acc;
    }, {});
  }

  private truncateValueStrings(): string {
    const keyValueIterable = this.valueMapStringNumber().entries();
    const keyValueArray = Array.from(keyValueIterable);
    if (keyValueArray.length <= this._displayListSizeLimit) {
      const pairs: string[] = [];
      keyValueArray.forEach(pair => {
        pairs.push(`${pair[0]}: ${pair[1]}`);
      });
      return pairs.join(',');
    } else {
      const slicedArray = keyValueArray.slice(0, this._displayListSizeLimit);
      const pairs: string[] = [];
      slicedArray.forEach(pair => {
        pairs.push(`${pair[0]}: ${pair[1]}`);
      });
      return pairs.join(',');
    }
  }

  public override toString(): string {
    return `${super.toString()}: valueSortedSetStringString: ${this.truncateValueStrings()}`;
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
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the dictionary fetch request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
