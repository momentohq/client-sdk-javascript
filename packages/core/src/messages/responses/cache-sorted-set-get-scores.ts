import {SdkError, UnknownError} from '../../errors';
import {
  ResponseBase,
  BaseResponseMiss,
  BaseResponseError,
} from './response-base';
import {
  _ECacheResult,
  _SortedSetGetScoreResponsePart,
} from './grpc-response-types';
import {CacheSortedSetGetScoresResponse} from './enums';
import {CacheSortedSetGetScore} from '../../index';

interface IResponse {
  value(): Record<string, number> | undefined;
  readonly type: CacheSortedSetGetScoresResponse;
}

/**
 * Indicates that the requested data was successfully retrieved from the cache.  Provides
 * `value*` accessors to retrieve the data in the appropriate format.
 */
export class Hit extends ResponseBase implements IResponse {
  private readonly _responses: CacheSortedSetGetScore.Response[] = [];
  readonly type: CacheSortedSetGetScoresResponse.Hit =
    CacheSortedSetGetScoresResponse.Hit;

  constructor(scores: _SortedSetGetScoreResponsePart[], values: Uint8Array[]) {
    super();
    scores.forEach((score, index) => {
      if (score.result === _ECacheResult.Hit) {
        this._responses.push(
          new CacheSortedSetGetScore.Hit(score.score, values[index])
        );
      } else if (score.result === _ECacheResult.Miss) {
        this._responses.push(new CacheSortedSetGetScore.Miss(values[index]));
      } else {
        this._responses.push(
          new CacheSortedSetGetScore.Error(
            new UnknownError(score.result.toString()),
            values[index]
          )
        );
      }
    });
  }

  public responses(): CacheSortedSetGetScore.Response[] {
    return this._responses;
  }

  /**
   * Returns the data as a Map whose keys are utf-8 strings, decoded from the underlying byte arrays and values are numbers.
   * @returns {Map<string, number>}
   */
  public valueMapString(): Map<string, number> {
    return this._responses.reduce((acc, response) => {
      if (response instanceof CacheSortedSetGetScore.Hit) {
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
      if (response instanceof CacheSortedSetGetScore.Hit) {
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
 * Indicates that the requested data was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  readonly type: CacheSortedSetGetScoresResponse.Miss =
    CacheSortedSetGetScoresResponse.Miss;

  public value(): undefined {
    return undefined;
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
export class Error extends BaseResponseError implements IResponse {
  readonly type: CacheSortedSetGetScoresResponse.Error =
    CacheSortedSetGetScoresResponse.Error;

  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  public value(): undefined {
    return undefined;
  }
}

export type Response = Hit | Miss | Error;
