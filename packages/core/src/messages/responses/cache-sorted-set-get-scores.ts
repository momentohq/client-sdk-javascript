import {SdkError, UnknownError} from '../../errors';
import {
  ResponseBase,
  ResponseHit,
  ResponseMiss,
  ResponseError,
} from './response-base';
import * as CacheSortedSetGetScoreResponse from './cache-sorted-set-get-score';
import {
  _ECacheResult,
  _SortedSetGetScoreResponsePart,
} from './grpc-response-types';

type CacheSortedSetGetScoreResponseType =
  | CacheSortedSetGetScoreResponse.Hit
  | CacheSortedSetGetScoreResponse.Miss
  | CacheSortedSetGetScoreResponse.Error;

/**
 * Parent response type for a sorted set get scores request.  The
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
 * if (response instanceof CacheSortedSetGetScores.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CacheSortedSetGetScores.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {
  public value(): Record<string, number> | undefined {
    if (this instanceof Hit) {
      return (this as Hit).value();
    }
    return undefined;
  }
}

class _Hit extends Response {
  public _responses: CacheSortedSetGetScoreResponseType[] = [];

  constructor(scores: _SortedSetGetScoreResponsePart[], values: Uint8Array[]) {
    super();
    scores.forEach((score, index) => {
      if (score.result === _ECacheResult.Hit) {
        this._responses.push(
          new CacheSortedSetGetScoreResponse.Hit(score.score, values[index])
        );
      } else if (score.result === _ECacheResult.Miss) {
        this._responses.push(
          new CacheSortedSetGetScoreResponse.Miss(values[index])
        );
      } else {
        this._responses.push(
          new CacheSortedSetGetScoreResponse.Error(
            new UnknownError(score.result.toString()),
            values[index]
          )
        );
      }
    });
  }

  public responses(): CacheSortedSetGetScoreResponseType[] {
    return this._responses;
  }

  /**
   * Returns the data as a Map whose keys are byte arrays and values numbers.
   * @returns {Map<Uint8Array, number>}
   */
  public valueMapUint8Array(): Map<Uint8Array, number> {
    return this._responses.reduce((acc, response) => {
      if (response instanceof CacheSortedSetGetScoreResponse.Hit) {
        acc.set(response.valueUint8Array(), response.score());
      }
      return acc;
    }, new Map<Uint8Array, number>());
  }

  /**
   * Returns the data as a Map whose keys are utf-8 strings, decoded from the underlying byte arrays and values are numbers.
   * @returns {Map<string, number>}
   */
  public valueMapString(): Map<string, number> {
    return this._responses.reduce((acc, response) => {
      if (response instanceof CacheSortedSetGetScoreResponse.Hit) {
        acc.set(response.valueString(), response.score());
      }
      return acc;
    }, new Map<string, number>());
  }

  /**
   * Returns the data as a Map whose keys and values are utf-8 strings, decoded from the underlying byte arrays.
   * This is a convenience alias for {valueMapStringString}.
   * @returns {Map<string, number>}
   */
  public valueMap(): Map<string, number> {
    return this.valueMapString();
  }

  /**
   * Returns the data as a Record whose keys and values are utf-8 strings, decoded from the underlying byte arrays.
   * This can be used in most places where an Object is desired.
   * @returns {Record<string, number>}
   */
  public valueRecordString(): Record<string, number> {
    return this._responses.reduce<Record<string, number>>((acc, response) => {
      if (response instanceof CacheSortedSetGetScoreResponse.Hit) {
        acc[response.valueString()] = response.score();
      }
      return acc;
    }, {});
  }

  /**
   * Returns the data as a Record whose keys and values are utf-8 strings, decoded from the underlying byte arrays.
   * This can be used in most places where an Object is desired.  This is a convenience alias for
   * {valueRecordStringString}.
   * @returns {Record<string, number>}
   */
  public valueRecord(): Record<string, number> {
    return this.valueRecordString();
  }

  /**
   * Returns the data as a Record whose keys and values are utf-8 strings, decoded from the underlying byte arrays.
   * This can be used in most places where an Object is desired.  This is a convenience alias for
   * {valueRecordStringString}.
   * @returns {Record<string, number>}
   */
  public value(): Record<string, number> {
    return this.valueRecord();
  }

  public override toString(): string {
    let stringRepresentation = '';
    this.valueMapString().forEach((value, key) => {
      const keyValue = `${key}: ${value}, `;
      stringRepresentation = stringRepresentation + keyValue;
    });
    return `${super.toString()}: valueMapString: ${stringRepresentation.slice(
      0,
      -2
    )}`;
  }
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `value*` accessors to retrieve the data in the appropriate format.
 */
export class Hit extends ResponseHit(_Hit) {}

class _Miss extends Response {}

/**
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends ResponseMiss(_Miss) {}

class _Error extends Response {
  constructor(public _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the dictionary get fields request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
