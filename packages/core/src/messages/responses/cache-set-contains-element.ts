import {SdkError} from '../../errors';
import {
  BaseResponseError,
  BaseResponseMiss,
  ResponseBase,
} from './response-base';
import {truncateString} from '../../internal/utils';
import {CacheSetContainsElementResponse} from './enums';

const TEXT_DECODER = new TextDecoder();

interface IResponse {
  element(): string | undefined;
  readonly type: CacheSetContainsElementResponse;
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `value*` accessors to retrieve the data in the appropriate format.
 */
export class Hit extends ResponseBase implements IResponse {
  private readonly _element: Uint8Array;
  readonly type: CacheSetContainsElementResponse.Hit =
    CacheSetContainsElementResponse.Hit;

  constructor(element: Uint8Array) {
    super();
    this._element = element;
  }

  /**
   * Returns the element as a utf-8 string, decoded from the underlying byte array.
   * @returns string
   */
  public element(): string {
    return this.elementString();
  }

  /**
   * Returns the element as a utf-8 string, decoded from the underlying byte array.
   * @returns string
   */
  public elementString(): string {
    return TEXT_DECODER.decode(this._element);
  }

  /**
   * Returns the element as a byte array.
   * @returns Uint8Array
   */
  public elementUint8Array(): Uint8Array {
    return this._element;
  }

  public override toString(): string {
    const display = truncateString(this.elementString());
    return `${super.toString()}: ${display}`;
  }
}

/**
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  private readonly _element: Uint8Array;
  readonly type: CacheSetContainsElementResponse.Miss =
    CacheSetContainsElementResponse.Miss;

  constructor(element: Uint8Array) {
    super();
    this._element = element;
  }

  /**
   * Returns the element as a utf-8 string decoded from the underlying byte array.
   * @returns {string}
   */
  public elementString(): string {
    return TEXT_DECODER.decode(this._element);
  }

  /**
   * Returns the element name as a byte array.
   * @returns {Uint8Array}
   */
  public elementUint8Array(): Uint8Array {
    return this._element;
  }

  element(): string | undefined {
    return undefined;
  }
}

/**
 * Indicates that an error occurred during the set contains element request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  private readonly _element: Uint8Array;
  readonly type: CacheSetContainsElementResponse.Error =
    CacheSetContainsElementResponse.Error;

  constructor(_innerException: SdkError, element: Uint8Array) {
    super(_innerException);
    this._element = element;
  }

  /**
   * Returns the element as a utf-8 string, decoded from the underlying byte array.
   * @returns string
   */
  public element(): string {
    return this.elementString();
  }

  /**
   * Returns the element as a utf-8 string, decoded from the underlying byte array.
   * @returns string
   */
  public elementString(): string {
    return TEXT_DECODER.decode(this._element);
  }

  /**
   * Returns the element as a byte array.
   * @returns Uint8Array
   */
  public elementUint8Array(): Uint8Array {
    return this._element;
  }
}

export type Response = Hit | Miss | Error;
