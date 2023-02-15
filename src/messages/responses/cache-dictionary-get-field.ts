// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {TextDecoder} from 'util';
import {SdkError} from '../../errors/errors';
import {
  ResponseBase,
  ResponseError,
  ResponseHit,
  ResponseMiss,
} from './response-base';
import {truncateString} from '../../internal/utils/display';

const TEXT_DECODER = new TextDecoder();

/**
 * Parent response type for a dictionary get field request.  The
 * response object is resolved to a type-safe object of one of
 * the following subtypes:
 *
 * - {Hit}
 * - {Miss}
 * - {Error}
 *
 * `instanceof` type guards can be used to operate on the appropriate subtype.
 * @example
 * For example:
 * ```
 * if (response instanceof CacheDictionaryGetField.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CacheDictionaryGetField.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

class _Hit extends Response {
  private readonly body: Uint8Array;
  constructor(body: Uint8Array) {
    super();
    this.body = body;
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
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `value*` accessors to retrieve the data in the appropriate format.
 */
export class Hit extends ResponseHit(_Hit) {
  private readonly field: Uint8Array;

  constructor(body: Uint8Array, field: Uint8Array) {
    super(body);
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
}

class _Miss extends Response {}

/**
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends ResponseMiss(_Miss) {
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
}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
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
export class Error extends ResponseError(_Error) {
  private readonly field: Uint8Array;

  constructor(public _innerException: SdkError, field: Uint8Array) {
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
}
