import {
  ResponseBase,
  ResponseHit,
  ResponseMiss,
  ResponseError,
} from './response-base';
import {SdkError} from '../../errors';

/**
 * Parent response type for a sorted set get score request.  The
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
 * if (response instanceof CacheSortedSetGetScore.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CacheSortedSetGetScore.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {
  public score(): number | undefined {
    if (this instanceof Hit) {
      return (this as Hit).score();
    }
    return undefined;
  }
}

class _Hit extends Response {
  private readonly _value: Uint8Array;
  private readonly _score: number;

  constructor(score: number, value: Uint8Array) {
    super();
    this._value = value;
    this._score = score;
  }

  /**
   * Returns the value of the element in the sorted set as a Uint8Array.
   * @returns {number}
   */
  public valueUint8Array(): Uint8Array {
    return this._value;
  }

  /**
   * Returns the score of the element in the sorted set as a string.
   * @returns {string}
   */
  public valueString(): string {
    return new TextDecoder().decode(this._value);
  }

  /**
   *
   *
   * @return {*}  {number}
   * @memberof _Hit
   */
  public score(): number {
    return this._score;
  }

  public override toString(): string {
    return `${super.toString()}: value: ${this.valueString()}, score: ${this.score()}`;
  }
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `score()` accessor to retrieve score.
 */
export class Hit extends ResponseHit(_Hit) {}

class _Miss extends Response {
  private readonly _value: Uint8Array;

  constructor(value: Uint8Array) {
    super();
    this._value = value;
  }

  /**
   * Returns the value of the element in the sorted set as a Uint8Array.
   * @returns {number}
   */
  public valueUint8Array(): Uint8Array {
    return this._value;
  }

  /**
   * Returns the score of the element in the sorted set as a string.
   * @returns {string}
   */
  public valueString(): string {
    return new TextDecoder().decode(this._value);
  }

  public override toString(): string {
    return `${super.toString()}: value: ${this.valueString()}`;
  }
}

/**
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends ResponseMiss(_Miss) {}

class _Error extends Response {
  private readonly _value: Uint8Array;

  constructor(protected _innerException: SdkError, value: Uint8Array) {
    super();
    this._value = value;
  }

  /**
   * Returns the value of the element in the sorted set as a Uint8Array.
   * @returns {number}
   */
  public valueUint8Array(): Uint8Array {
    return this._value;
  }

  /**
   * Returns the score of the element in the sorted set as a string.
   * @returns {string}
   */
  public valueString(): string {
    return new TextDecoder().decode(this._value);
  }
}

/**
 * Indicates that an error occurred during the sorted set get score request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
