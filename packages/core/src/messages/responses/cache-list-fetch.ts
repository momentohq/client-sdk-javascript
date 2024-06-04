import {SdkError} from '../../errors';
import {
  BaseResponseError,
  BaseResponseMiss,
  ResponseBase,
} from './response-base';
import {truncateStringArray} from '../../internal/utils';
import {CacheListFetchResponse} from './enums';

const TEXT_DECODER = new TextDecoder();

interface IResponse {
  value(): string[] | undefined;
  type: CacheListFetchResponse;
}

/**
 * Indicates that the requested list was successfully retrieved from the cache.
 * Provides `value*` accessors to retrieve the data in the appropriate format.
 */
export class Hit extends ResponseBase implements IResponse {
  readonly type: CacheListFetchResponse.Hit = CacheListFetchResponse.Hit;
  private readonly _values: Uint8Array[];

  constructor(values: Uint8Array[]) {
    super();
    this._values = values;
  }

  /**
   * Returns the data as an array of byte arrays.
   * @returns {Uint8Array[]}
   */
  public valueListUint8Array(): Uint8Array[] {
    return this._values;
  }

  /**
   * Returns the data as an array of strings, decoded from the underlying byte array.
   * @returns {string[]}
   */
  public valueListString(): string[] {
    return this._values.map(v => TEXT_DECODER.decode(v));
  }

  /**
   * Returns the data as an array of strings, decoded from the underlying byte array.  This is a convenience alias
   * for {valueListString}
   * @returns {string[]}
   */
  public valueList(): string[] {
    return this.valueListString();
  }

  /**
   * Returns the data as an array of strings, decoded from the underlying byte array.
   * This is a convenience alias for {valueListString}
   * @returns {string[]}
   */
  public value(): string[] {
    return this.valueListString();
  }

  public override toString(): string {
    const truncatedStringArray = truncateStringArray(this.valueListString());
    return `${super.toString()}: [${truncatedStringArray.toString()}]`;
  }
}

/**
 * Indicates that the requested list was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  readonly type: CacheListFetchResponse.Miss = CacheListFetchResponse.Miss;

  constructor() {
    super();
  }

  value(): undefined {
    return undefined;
  }
}

/**
 * Indicates that an error occurred during the list fetch request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: CacheListFetchResponse.Error = CacheListFetchResponse.Error;

  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  value(): undefined {
    return undefined;
  }
}

export type Response = Hit | Miss | Error;
