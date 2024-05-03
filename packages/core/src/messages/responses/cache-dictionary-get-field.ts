import {SdkError} from '../../errors';
import {
  BaseResponseError,
  BaseResponseMiss,
  ResponseBase,
} from './response-base';
import {truncateString} from '../../internal/utils';

const TEXT_DECODER = new TextDecoder();

interface IResponse {
  value(): string | undefined;
  responseType: ResponseType;
}

export enum ResponseType {
  Hit = 'Hit',
  Miss = 'Miss',
  Error = 'Error',
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `value*` accessors to retrieve the data in the appropriate format.
 */
export class Hit extends ResponseBase implements IResponse {
  private readonly body: Uint8Array;
  private readonly field: Uint8Array;

  constructor(body: Uint8Array, field: Uint8Array) {
    super();
    this.body = body;
    this.field = field;
  }

  /**
   * Returns the data as a utf-8 string, decoded from the underlying byte array.
   * @returns string
   */
  public value(): string {
    return this.valueString();
  }

  /**
   * Returns the data as a utf-8 string, decoded from the underlying byte array.
   * @returns string
   */
  public valueString(): string {
    return TEXT_DECODER.decode(this.body);
  }

  /**
   * Returns the data as a byte array.
   * @returns {Uint8Array}
   */
  public valueUint8Array(): Uint8Array {
    return this.body;
  }

  public override toString(): string {
    const display = truncateString(this.valueString());
    return `${super.toString()}: ${display}`;
  }

  /**
   * Returns the field name for the retrieved element, as a utf-8 string decoded from the underlying byte array.
   * @returns {string}
   */
  public fieldString(): string {
    return TEXT_DECODER.decode(this.field);
  }

  /**
   * Returns the field name for the retrieved element, as a byte array.
   * @returns {Uint8Array}
   */
  public fieldUint8Array(): Uint8Array {
    return this.field;
  }

  responseType: ResponseType.Hit;
}

/**
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  private readonly field: Uint8Array;

  constructor(field: Uint8Array) {
    super();
    this.field = field;
  }

  /**
   * Returns the field name for the retrieved element, as a utf-8 string decoded from the underlying byte array.
   * @returns {string}
   */
  public fieldString(): string {
    return TEXT_DECODER.decode(this.field);
  }

  /**
   * Returns the field name for the retrieved element, as a byte array.
   * @returns {Uint8Array}
   */
  public fieldUint8Array(): Uint8Array {
    return this.field;
  }

  responseType: ResponseType.Miss;
  value(): string | undefined {
    return undefined;
  }
}

/**
 * Indicates that an error occurred during the dictionary get field request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  private readonly field: Uint8Array;

  constructor(_innerException: SdkError, field: Uint8Array) {
    super(_innerException);
    this.field = field;
  }

  /**
   * Returns the field name for the retrieved element, as a utf-8 string decoded from the underlying byte array.
   * @returns {string}
   */
  public fieldString(): string {
    return TEXT_DECODER.decode(this.field);
  }

  /**
   * Returns the field name for the retrieved element, as a byte array.
   * @returns {Uint8Array}
   */
  public fieldUint8Array(): Uint8Array {
    return this.field;
  }

  responseType: ResponseType.Error;

  value(): string | undefined {
    return undefined;
  }
}

export type Response = Hit | Miss | Error;
