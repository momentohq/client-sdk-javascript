import {SdkError} from '../../../errors';
import {FunctionInfo} from '../../function-info';
import {BaseResponseError, BaseResponseSuccess} from '../response-base';
import {ListFunctionsResponse} from '../enums';

interface IResponse {
  readonly type: ListFunctionsResponse;
}

/**
 * Indicates a successful list-functions request, carrying the functions in the cache.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: ListFunctionsResponse.Success = ListFunctionsResponse.Success;
  private readonly _functions: FunctionInfo[];

  constructor(functions: FunctionInfo[]) {
    super();
    this._functions = functions;
  }

  /**
   * The functions in the cache.
   * @returns {FunctionInfo[]}
   */
  public getFunctions(): FunctionInfo[] {
    return [...this._functions];
  }

  public override toString(): string {
    return `${super.toString()}: ${this._functions.length} functions`;
  }
}

/**
 * Indicates that an error occurred during the list-functions request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: ListFunctionsResponse.Error = ListFunctionsResponse.Error;

  constructor(_innerException: SdkError) {
    super(_innerException);
  }
}

export type Response = Success | Error;
