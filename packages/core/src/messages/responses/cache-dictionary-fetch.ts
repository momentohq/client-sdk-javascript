import {
  ResponseBase,
  BaseResponseMiss,
  BaseResponseError,
} from './response-base';
import {SdkError} from '../../errors';
import {_DictionaryFieldValuePair} from './grpc-response-types';
import {CacheDictionaryFetchResponse} from './enums';

const TEXT_DECODER = new TextDecoder();

interface IResponse {
  value(): Record<string, string> | undefined;
  readonly type: CacheDictionaryFetchResponse;
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `value*` accessors to retrieve the data in the appropriate format.
 */
export class Hit extends ResponseBase implements IResponse {
  private readonly items: _DictionaryFieldValuePair[];
  private readonly _displayListSizeLimit = 5;
  readonly type: CacheDictionaryFetchResponse.Hit =
    CacheDictionaryFetchResponse.Hit;

  constructor(items: _DictionaryFieldValuePair[]) {
    super();
    this.items = items;
  }

  /**
   * Returns the data as a Map whose keys and values are utf-8 strings, decoded from the underlying byte arrays.
   * This is a convenience alias for {valueMapStringString}.
   * @returns {Map<string, string>}
   */
  public valueMap(): Map<string, string> {
    return this.valueMapStringString();
  }

  /**
   * Returns the data as a Map whose keys and values are utf-8 strings, decoded from the underlying byte arrays.
   * @returns {Map<string, string>}
   */
  public valueMapStringString(): Map<string, string> {
    return this.items.reduce((acc, item) => {
      acc.set(TEXT_DECODER.decode(item.field), TEXT_DECODER.decode(item.value));
      return acc;
    }, new Map<string, string>());
  }

  /**
   * Returns the data as a Map whose keys are utf-8 strings, decoded from the underlying byte array, and whose values
   * are byte arrays.
   * @returns {Map<string, Uint8Array>}
   */
  public valueMapStringUint8Array(): Map<string, Uint8Array> {
    return this.items.reduce((acc, item) => {
      acc.set(TEXT_DECODER.decode(item.field), item.value);
      return acc;
    }, new Map<string, Uint8Array>());
  }

  /**
   * Returns the data as a Record whose keys and values are utf-8 strings, decoded from the underlying byte arrays.
   * This can be used in most places where an Object is desired.  This is a convenience alias for
   * {valueRecordStringString}.
   * @returns {Record<string, string>}
   */
  public value(): Record<string, string> {
    return this.valueRecordStringString();
  }

  /**
   * Returns the data as a Record whose keys and values are utf-8 strings, decoded from the underlying byte arrays.
   * This can be used in most places where an Object is desired.  This is a convenience alias for
   * {valueRecordStringString}.
   * @returns {Record<string, string>}
   */
  public valueRecord(): Record<string, string> {
    return this.valueRecordStringString();
  }

  /**
   * Returns the data as a Record whose keys and values are utf-8 strings, decoded from the underlying byte arrays.
   * This can be used in most places where an Object is desired.
   * @returns {Record<string, string>}
   */
  public valueRecordStringString(): Record<string, string> {
    return this.items.reduce<Record<string, string>>((acc, item) => {
      acc[TEXT_DECODER.decode(item.field)] = TEXT_DECODER.decode(item.value);
      return acc;
    }, {});
  }

  /**
   * Returns the data as a Record whose keys are utf-8 strings, decoded from the underlying byte array, and whose
   * values are byte arrays.  This can be used in most places where an Object is desired.
   * @returns {Record<string, Uint8Array>}
   */
  public valueRecordStringUint8Array(): Record<string, Uint8Array> {
    return this.items.reduce<Record<string, Uint8Array>>((acc, item) => {
      acc[TEXT_DECODER.decode(item.field)] = item.value;
      return acc;
    }, {});
  }

  private truncateValueStrings(): string {
    const keyValueIterable = this.valueMapStringString().entries();
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
    return `${super.toString()}: valueDictionaryStringString: ${this.truncateValueStrings()}`;
  }
}

/**
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  readonly type: CacheDictionaryFetchResponse.Miss =
    CacheDictionaryFetchResponse.Miss;

  value(): Record<string, string> | undefined {
    return undefined;
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
  readonly type: CacheDictionaryFetchResponse.Error =
    CacheDictionaryFetchResponse.Error;
  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  value(): Record<string, string> | undefined {
    return undefined;
  }
}

export type Response = Hit | Miss | Error;
