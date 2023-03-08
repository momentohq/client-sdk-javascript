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
  private readonly elements: cache_client._SortedSetElement[];
  private readonly _displayListSizeLimit = 5;

  constructor(elements: cache_client._SortedSetElement[]) {
    super();
    this.elements = elements;
  }

  /**
   * Returns the elements as an array of objects, each containing a `value` and `score` field.
   * The value is a byte array, and the score is a number.
   * @returns {{value: Uint8Array; score: number}[]}
   */
  public valueArrayUint8Elements(): {value: Uint8Array; score: number}[] {
    return this.elements.map(item => {
      return {
        value: item.value,
        score: item.score,
      };
    });
  }

  /**
   * Returns the elements as an array of objects, each containing a `value` and `score` field.
   * The value is a utf-8 string, decoded from the underlying byte array, and the score is a number.
   * @returns {{value: string; score: number}[]}
   */
  public valueArrayStringElements(): {value: string; score: number}[] {
    return this.elements.map(item => {
      return {
        value: TEXT_DECODER.decode(item.value),
        score: item.score,
      };
    });
  }

  /**
   * Returns the elements as an array of objects, each containing a `value` and `score` field.
   * The value is a utf-8 string, decoded from the underlying byte array, and the score is a number.
   * This is a convenience alias for {valueArrayStringNumber}.
   * @returns {value: string; score: number}[]
   */
  public valueArray(): {value: string; score: number}[] {
    return this.valueArrayStringElements();
  }

  private truncateValueStrings(): string {
    const keyValueArray = this.valueArrayStringElements();

    const elements: string[] = [];
    if (keyValueArray.length <= this._displayListSizeLimit) {
      keyValueArray.forEach(element => {
        elements.push(`${element.value}: ${element.score}`);
      });
    } else {
      const slicedArray = keyValueArray.slice(0, this._displayListSizeLimit);
      slicedArray.forEach(element => {
        elements.push(`${element.value}: ${element.score}`);
      });
    }
    return elements.join(', ');
  }

  public override toString(): string {
    return `${super.toString()}: valueArrayStringElements: ${this.truncateValueStrings()}`;
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
