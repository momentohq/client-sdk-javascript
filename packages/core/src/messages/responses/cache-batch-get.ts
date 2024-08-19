import {SdkError} from '../../errors';
import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {CacheGetBatchResponse} from './enums';
import {CacheGet} from '../..';

const TEXT_DECODER = new TextDecoder();

interface IResponse {
  values(): Record<string, string> | undefined;
  readonly type: CacheGetBatchResponse;
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.
 * Provides `value*` accessors to retrieve the data in the appropriate format.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: CacheGetBatchResponse.Success = CacheGetBatchResponse.Success;
  private readonly body: CacheGet.Response[];
  private readonly keys: Uint8Array[];

  constructor(body: CacheGet.Response[], keys: Uint8Array[]) {
    super();
    this.body = body;
    this.keys = keys;
  }

  /**
   * Returns the status for each request in the batch as a list of CacheGet.Response objects.
   * @returns {CacheGet.Response[]}
   */
  public results(): CacheGet.Response[] {
    return this.body;
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
    return this.body.reduce<Record<string, string>>((acc, item, index) => {
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
    return this.body.reduce<Record<string, Uint8Array>>((acc, item, index) => {
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
    return this.body.reduce((acc, item, index) => {
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
    return this.body.reduce((acc, item, index) => {
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
 * Indicates that an error occurred during the cache get batch request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  readonly type: CacheGetBatchResponse.Error = CacheGetBatchResponse.Error;

  values(): undefined {
    return;
  }
}

export type Response = Success | Error;
