import {
  ResponseBase,
  BaseResponseMiss,
  BaseResponseError,
} from './response-base';
import {SdkError} from '../../errors';
import {CacheSortedSetGetScoreResponse} from './enums';

interface IResponse {
  score(): number | undefined;
  readonly type: CacheSortedSetGetScoreResponse;
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `score()` accessor to retrieve score.
 */
export class Hit extends ResponseBase implements IResponse {
  private readonly _value: Uint8Array;
  private readonly _score: number;
  readonly type: CacheSortedSetGetScoreResponse.Hit =
    CacheSortedSetGetScoreResponse.Hit;

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
   * Returns the value of the element in the sorted set as a string.
   * @returns {string}
   */
  public valueString(): string {
    return new TextDecoder().decode(this._value);
  }

  /**
   * Returns the score of the element in the sorted set.
   * @return {*}  {number}
   */
  public score(): number {
    return this._score;
  }

  public override toString(): string {
    return `${super.toString()}: value: ${this.valueString()}`;
  }
}

/**
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  private readonly _value: Uint8Array;
  readonly type: CacheSortedSetGetScoreResponse.Miss =
    CacheSortedSetGetScoreResponse.Miss;

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

  public score(): undefined {
    return;
  }

  public override toString(): string {
    return `${super.toString()}: value: ${this.valueString()}`;
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
export class Error extends BaseResponseError implements IResponse {
  private readonly _value: Uint8Array;
  readonly type: CacheSortedSetGetScoreResponse.Error =
    CacheSortedSetGetScoreResponse.Error;

  constructor(_innerException: SdkError, value: Uint8Array) {
    super(_innerException);
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

  public score(): undefined {
    return;
  }
}

export type Response = Hit | Miss | Error;
