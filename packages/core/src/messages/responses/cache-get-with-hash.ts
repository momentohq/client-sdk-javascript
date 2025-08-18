import {SdkError} from '../../errors';
import {
  BaseResponseError,
  BaseResponseMiss,
  ResponseBase,
} from './response-base';
import {truncateString} from '../../internal/utils';
import {CacheGetWithHashResponse} from './enums';

const TEXT_DECODER = new TextDecoder();

interface IResponse {
  value(): string | undefined;
  hash(): string | undefined;
  readonly type: CacheGetWithHashResponse;
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `value*` and `hash*` accessors to retrieve the data in the appropriate format.
 */
export class Hit extends ResponseBase implements IResponse {
  readonly type: CacheGetWithHashResponse.Hit = CacheGetWithHashResponse.Hit;
  private readonly _value: Uint8Array;
  private readonly _hash: Uint8Array;
  constructor(value: Uint8Array, hash: Uint8Array) {
    super();
    this._value = value;
    this._hash = hash;
  }

  /**
   * Returns the data as a utf-8 string, decoded from the underlying byte array.
   * @returns string
   */
  public value(): string {
    return TEXT_DECODER.decode(this._value);
  }
  /**
   * Returns the hash of the data as a utf-8 string, decoded from the underlying byte array.
   * @returns string
   */
  public hash(): string {
    return TEXT_DECODER.decode(this._hash);
  }

  /**
   * Returns the data as a utf-8 string, decoded from the underlying byte array.
   * @returns string
   */
  public valueString(): string {
    return TEXT_DECODER.decode(this._value);
  }

  /**
   * Returns the data as a byte array.
   * @returns {Uint8Array}
   */
  public valueUint8Array(): Uint8Array {
    return this._value;
  }

  /**
   * Returns the hash of the data as a utf-8 string, decoded from the underlying byte array.
   * @returns string
   */
  public hashString(): string {
    return TEXT_DECODER.decode(this._hash);
  }

  /**
   * Returns the hash of the data as a byte array.
   * @returns {Uint8Array}
   */
  public hashUint8Array(): Uint8Array {
    return this._hash;
  }

  public override toString(): string {
    const displayValue = truncateString(this.valueString());
    const displayHash = truncateString(this.hashString());
    return `${super.toString()}: value=${displayValue}, hash=${displayHash}`;
  }
}

/**
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  readonly type: CacheGetWithHashResponse.Miss = CacheGetWithHashResponse.Miss;

  constructor() {
    super();
  }

  value(): undefined {
    return undefined;
  }

  hash(): undefined {
    return undefined;
  }
}

/**
 * Indicates that an error occurred during the cache get request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: CacheGetWithHashResponse.Error =
    CacheGetWithHashResponse.Error;
  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  value(): undefined {
    return undefined;
  }

  hash(): undefined {
    return undefined;
  }
}

export type Response = Hit | Miss | Error;
