import {SdkError} from '../../errors';
import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {CacheIncrementResponse} from './enums';

interface IResponse {
  value(): number | undefined;
  readonly type: CacheIncrementResponse;
}

/**
 * Indicates a successful cache increment request.
 * Provides `value*` accessors to retrieve the updated value in the appropriate format.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: CacheIncrementResponse.Success =
    CacheIncrementResponse.Success;
  private readonly body: number;

  constructor(body: number) {
    super();
    this.body = body;
  }

  /**
   * Returns the updated value as a number.
   * @returns number
   */
  public value(): number {
    return this.body;
  }

  /**
   * Returns the updated value as a number.
   * @returns number
   */
  public valueNumber(): number {
    return this.body;
  }

  public override toString(): string {
    return `${super.toString()}: value: ${this.value()}`;
  }
}

/**
 * Indicates that an error occurred during the increment request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error.
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  readonly type: CacheIncrementResponse.Error = CacheIncrementResponse.Error;

  value(): undefined {
    return;
  }
}

export type Response = Success | Error;
