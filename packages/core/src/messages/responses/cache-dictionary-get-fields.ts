import {SdkError, UnknownError} from '../../errors';
import {
  ResponseBase,
  BaseResponseMiss,
  BaseResponseError,
} from './response-base';
import {
  type Response as CacheDictionaryGetFieldResponseType,
  Hit as CacheDictionaryGetFieldResponseHit,
  Miss as CacheDictionaryGetFieldResponseMiss,
  Error as CacheDictionaryGetFieldResponseError,
} from './cache-dictionary-get-field';
import {_DictionaryGetResponsePart, _ECacheResult} from './grpc-response-types';
import {DictionaryGetFieldsResponse} from './enums';

const TEXT_DECODER = new TextDecoder();

interface IResponse {
  value(): Record<string, string> | undefined;
  type: DictionaryGetFieldsResponse;
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `value*` accessors to retrieve the data in the appropriate format.
 */
export class Hit extends ResponseBase implements IResponse {
  private readonly items: _DictionaryGetResponsePart[];
  private readonly fields: Uint8Array[];
  public readonly type: DictionaryGetFieldsResponse.Hit =
    DictionaryGetFieldsResponse.Hit;
  public responses: CacheDictionaryGetFieldResponseType[] = [];

  constructor(items: _DictionaryGetResponsePart[], fields: Uint8Array[]) {
    super();
    this.items = items;
    this.fields = fields;

    items.forEach((item, index) => {
      if (item.result === _ECacheResult.Hit) {
        this.responses.push(
          new CacheDictionaryGetFieldResponseHit(item.cacheBody, fields[index])
        );
      } else if (item.result === _ECacheResult.Miss) {
        this.responses.push(
          new CacheDictionaryGetFieldResponseMiss(fields[index])
        );
      } else {
        this.responses.push(
          new CacheDictionaryGetFieldResponseError(
            new UnknownError(item.result.toString()),
            fields[index]
          )
        );
      }
    });
  }

  /**
   * Returns the data as a Map whose keys and values are byte arrays.
   * @returns {Map<Uint8Array, Uint8Array>}
   */
  public valueMapUint8ArrayUint8Array(): Map<Uint8Array, Uint8Array> {
    return this.items.reduce((acc, item, index) => {
      if (item.result === _ECacheResult.Hit) {
        acc.set(this.fields[index], item.cacheBody);
      }
      return acc;
    }, new Map<Uint8Array, Uint8Array>());
  }

  /**
   * Returns the data as a Map whose keys and values are utf-8 strings, decoded from the underlying byte arrays.
   * @returns {Map<string, string>}
   */
  public valueMapStringString(): Map<string, string> {
    return this.items.reduce((acc, item, index) => {
      if (item.result === _ECacheResult.Hit) {
        acc.set(
          TEXT_DECODER.decode(this.fields[index]),
          TEXT_DECODER.decode(item.cacheBody)
        );
      }
      return acc;
    }, new Map<string, string>());
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
   * Returns the data as a Map whose keys are utf-8 strings, decoded from the underlying byte array, and whose values
   * are byte arrays.
   * @returns {Map<string, Uint8Array>}
   */
  public valueMapStringUint8Array(): Map<string, Uint8Array> {
    return this.items.reduce((acc, item, index) => {
      if (item.result === _ECacheResult.Hit) {
        acc.set(TEXT_DECODER.decode(this.fields[index]), item.cacheBody);
      }
      return acc;
    }, new Map<string, Uint8Array>());
  }

  /**
   * Returns the data as a Record whose keys and values are utf-8 strings, decoded from the underlying byte arrays.
   * This can be used in most places where an Object is desired.
   * @returns {Record<string, string>}
   */
  public valueRecordStringString(): Record<string, string> {
    return this.items.reduce<Record<string, string>>((acc, item, index) => {
      if (item.result === _ECacheResult.Hit) {
        acc[TEXT_DECODER.decode(this.fields[index])] = TEXT_DECODER.decode(
          item.cacheBody
        );
      }
      return acc;
    }, {});
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
   * This can be used in most places where an Object is desired.  This is a convenience alias for
   * {valueRecordStringString}.
   * @returns {Record<string, string>}
   */
  public value(): Record<string, string> {
    return this.valueRecordStringString();
  }

  /**
   * Returns the data as a Record whose keys are utf-8 strings, decoded from the underlying byte array, and whose
   * values are byte arrays.  This can be used in most places where an Object is desired.
   * @returns {Record<string, Uint8Array>}
   */
  public valueRecordStringUint8Array(): Record<string, Uint8Array> {
    return this.items.reduce<Record<string, Uint8Array>>((acc, item, index) => {
      if (item.result === _ECacheResult.Hit) {
        acc[TEXT_DECODER.decode(this.fields[index])] = item.cacheBody;
      }
      return acc;
    }, {});
  }

  public override toString(): string {
    let stringRepresentation = '';
    this.valueMapStringString().forEach((value, key) => {
      const keyValue = `${key}: ${value}, `;
      stringRepresentation = stringRepresentation + keyValue;
    });
    return `${super.toString()}: valueDictionaryStringString: ${stringRepresentation.slice(
      0,
      -2
    )}`;
  }
}

/**
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  public readonly type: DictionaryGetFieldsResponse.Miss =
    DictionaryGetFieldsResponse.Miss;

  value(): Record<string, string> | undefined {
    return undefined;
  }
}

/**
 * Indicates that an error occurred during the dictionary get fields request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  public readonly type: DictionaryGetFieldsResponse.Error =
    DictionaryGetFieldsResponse.Error;
  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  value(): Record<string, string> | undefined {
    return undefined;
  }
}

export type Response = Hit | Miss | Error;
