// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {cache} from '@gomomento/generated-types';
import grpcCache = cache.cache_client;
import {TextDecoder} from 'util';
import {SdkError, UnknownError} from '../../errors/errors';
import {
  ResponseBase,
  ResponseHit,
  ResponseMiss,
  ResponseError,
} from './response-base';
import * as CacheDictionaryGetFieldResponse from './cache-dictionary-get-field';

const TEXT_DECODER = new TextDecoder();
type CacheDictionaryGetFieldResponseType =
  | CacheDictionaryGetFieldResponse.Hit
  | CacheDictionaryGetFieldResponse.Miss
  | CacheDictionaryGetFieldResponse.Error;

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
  private readonly items: grpcCache._DictionaryGetResponse._DictionaryGetResponsePart[];
  private readonly fields: Uint8Array[];
  public responses: CacheDictionaryGetFieldResponseType[] = [];

  constructor(
    items: grpcCache._DictionaryGetResponse._DictionaryGetResponsePart[],
    fields: Uint8Array[]
  ) {
    super();
    this.items = items;
    this.fields = fields;
    items.forEach((item, index) => {
      if (item.result === grpcCache.ECacheResult.Hit) {
        this.responses.push(
          new CacheDictionaryGetFieldResponse.Hit(
            item.cache_body,
            fields[index]
          )
        );
      } else if (item.result === grpcCache.ECacheResult.Miss) {
        this.responses.push(
          new CacheDictionaryGetFieldResponse.Miss(fields[index])
        );
      } else {
        this.responses.push(
          new CacheDictionaryGetFieldResponse.Error(
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
      if (item.result === grpcCache.ECacheResult.Hit) {
        acc.set(this.fields[index], item.cache_body);
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
      if (item.result === grpcCache.ECacheResult.Hit) {
        acc.set(
          TEXT_DECODER.decode(this.fields[index]),
          TEXT_DECODER.decode(item.cache_body)
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
      if (item.result === grpcCache.ECacheResult.Hit) {
        acc.set(TEXT_DECODER.decode(this.fields[index]), item.cache_body);
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
      if (item.result === grpcCache.ECacheResult.Hit) {
        acc[TEXT_DECODER.decode(this.fields[index])] = TEXT_DECODER.decode(
          item.cache_body
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
   * Returns the data as a Record whose keys are utf-8 strings, decoded from the underlying byte array, and whose
   * values are byte arrays.  This can be used in most places where an Object is desired.
   * @returns {Record<string, Uint8Array>}
   */
  public valueRecordStringUint8Array(): Record<string, Uint8Array> {
    return this.items.reduce<Record<string, Uint8Array>>((acc, item, index) => {
      if (item.result === grpcCache.ECacheResult.Hit) {
        acc[TEXT_DECODER.decode(this.fields[index])] = item.cache_body;
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
