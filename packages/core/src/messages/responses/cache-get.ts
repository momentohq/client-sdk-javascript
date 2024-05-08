import {SdkError} from '../../errors';
import {
  BaseResponseError,
  BaseResponseMiss,
  ResponseBase,
} from './response-base';
import {truncateString} from '../../internal/utils';
import {CacheGetResponse} from './enums';

const TEXT_DECODER = new TextDecoder();

interface IResponse {
  value(): string | undefined;
  type: CacheGetResponse;
}

/**
 * Parent response type for a cache get request.  The
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
 * if (response instanceof CacheGet.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CacheGet.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `value*` accessors to retrieve the data in the appropriate format.
 */

// interface IGetResponse {
//   value(): string;
//   type: CacheGetResponse.Hit;
// }
export class Hit extends ResponseBase implements IResponse {
  readonly type: CacheGetResponse.Hit = CacheGetResponse.Hit;
  private readonly body: Uint8Array;
  constructor(body: Uint8Array) {
    super();
    this.body = body;
  }

  /**
   * Returns the data as a utf-8 string, decoded from the underlying byte array.
   * @returns string
   */
  public value(): string {
    return TEXT_DECODER.decode(this.body);
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
 * Indicates that the requested data was not available in the cache.
 */
// interface IMissResponse {
//   value(): undefined;
//   type: CacheGetResponse.Miss;
// }
export class Miss extends BaseResponseMiss implements IResponse {
  readonly type: CacheGetResponse.Miss = CacheGetResponse.Miss;

  constructor() {
    super();
  }

  value(): undefined {
    return undefined;
  }
}

// interface IErrorResponse {
//   value(): undefined;
//   type: CacheGetResponse.Error;
// }
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
  readonly type: CacheGetResponse.Error = CacheGetResponse.Error;
  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  value(): undefined {
    return undefined;
  }
}

export type Response = Hit | Miss | Error;

const miss: Response = new Miss();
const r = miss as Response;

switch (r.type) {
  case CacheGetResponse.Miss:
    break;
  case CacheGetResponse.Hit:
    break;
  case CacheGetResponse.Error:
    break;
}
