import {SdkError} from '../../errors';
import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {DictionaryIncrementResponse} from './enums';

interface IResponse {
  value(): number | undefined;
  type: DictionaryIncrementResponse;
}

/**
 * Indicates a Successful dictionary increment request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  private readonly _value: number;
  readonly type: DictionaryIncrementResponse.Success =
    DictionaryIncrementResponse.Success;

  constructor(value: number) {
    super();
    this._value = value;
  }

  /**
   * The new value of the element after incrementing.
   * @returns {number}
   */
  public value(): number {
    return this._value;
  }
  public valueNumber(): number {
    return this._value;
  }

  public override toString(): string {
    return `${super.toString()}: value: ${this.valueNumber()}`;
  }
}

/**
 * Indicates that an error occurred during the dictionary increment request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: DictionaryIncrementResponse.Error =
    DictionaryIncrementResponse.Error;
  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  public value(): undefined {
    return undefined;
  }
}

export type Response = Success | Error;
