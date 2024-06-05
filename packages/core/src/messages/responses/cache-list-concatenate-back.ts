import {SdkError} from '../../errors';
import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {CacheListConcatenateBackResponse} from './enums';

interface IResponse {
  readonly type: CacheListConcatenateBackResponse;
}

/**
 * Indicates a successful list concatenate back request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: CacheListConcatenateBackResponse.Success =
    CacheListConcatenateBackResponse.Success;

  private readonly _listLength: number;

  constructor(listLength: number) {
    super();
    this._listLength = listLength;
  }

  /**
   * Returns the new length of the list after the concatenate operation.
   * @returns {number}
   */
  public listLength(): number {
    return this._listLength;
  }

  public override toString(): string {
    return `${super.toString()}: listLength: ${this._listLength}`;
  }
}

/**
 * Indicates that an error occurred during the list concatenate back request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  readonly type: CacheListConcatenateBackResponse.Error =
    CacheListConcatenateBackResponse.Error;
}

export type Response = Success | Error;
