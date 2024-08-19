import {
  ResponseBase,
  BaseResponseMiss,
  BaseResponseError,
} from './response-base';
import {SdkError} from '../../errors';
import {truncateStringArray} from '../../internal/utils';
import {CacheSetSampleResponse} from './enums';

const TEXT_DECODER = new TextDecoder();

interface IResponse {
  value(): string[] | undefined;
  readonly type: CacheSetSampleResponse;
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `value*` accessors to retrieve the data in the appropriate format.
 */
export class Hit extends ResponseBase implements IResponse {
  private readonly elements: Uint8Array[];
  readonly type: CacheSetSampleResponse.Hit = CacheSetSampleResponse.Hit;

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
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  readonly type: CacheSetSampleResponse.Miss = CacheSetSampleResponse.Miss;
  public value(): undefined {
    return;
  }
}

/**
 * Indicates that an error occurred during the set sample request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError {
  readonly type: CacheSetSampleResponse.Error = CacheSetSampleResponse.Error;
  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  public value(): undefined {
    return;
  }
}

export type Response = Hit | Miss | Error;
