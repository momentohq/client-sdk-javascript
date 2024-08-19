import {
  ResponseBase,
  BaseResponseMiss,
  BaseResponseError,
} from './response-base';
import {_SortedSetElement} from './grpc-response-types';
import {CacheSortedSetFetchResponse} from './enums';
import {SdkError} from '../../errors';

const TEXT_DECODER = new TextDecoder();

interface IResponse {
  value(): {value: string; score: number}[] | undefined;
  readonly type: CacheSortedSetFetchResponse;
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `value*` accessors to retrieve the data in the appropriate format.
 */
export class Hit extends ResponseBase implements IResponse {
  private readonly elements: _SortedSetElement[];
  private readonly _displayListSizeLimit = 5;
  readonly type: CacheSortedSetFetchResponse.Hit =
    CacheSortedSetFetchResponse.Hit;

  constructor(elements: _SortedSetElement[]) {
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

  /**
   * Returns the elements as an array of objects, each containing a `value` and `score` field.
   * The value is a utf-8 string, decoded from the underlying byte array, and the score is a number.
   * This is a convenience alias for {valueArrayStringNumber}.
   * @returns {value: string; score: number}[]
   */
  public value(): {value: string; score: number}[] {
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
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  readonly type: CacheSortedSetFetchResponse.Miss =
    CacheSortedSetFetchResponse.Miss;

  public value(): undefined {
    return;
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
export class Error extends BaseResponseError implements IResponse {
  readonly type: CacheSortedSetFetchResponse.Error =
    CacheSortedSetFetchResponse.Error;

  constructor(error: SdkError) {
    super(error);
  }

  public value(): undefined {
    return;
  }
}

export type Response = Hit | Miss | Error;
