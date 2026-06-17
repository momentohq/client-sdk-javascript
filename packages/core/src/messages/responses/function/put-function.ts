import {SdkError} from '../../../errors';
import {FunctionInfo} from '../../function-info';
import {BaseResponseError, BaseResponseSuccess} from '../response-base';
import {PutFunctionResponse} from '../enums';

interface IResponse {
  readonly type: PutFunctionResponse;
}

/**
 * Indicates a successful put-function request. The function is created, or updated if one already exists with
 * the same cache + name (each update creates a new version); the returned function carries its full metadata.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: PutFunctionResponse.Success = PutFunctionResponse.Success;
  private readonly _function: FunctionInfo;

  constructor(deployedFunction: FunctionInfo) {
    super();
    this._function = deployedFunction;
  }

  /**
   * The deployed function's metadata.
   * @returns {FunctionInfo}
   */
  public getFunction(): FunctionInfo {
    return this._function;
  }

  /**
   * The id of the deployed function.
   * @returns {string}
   */
  public functionId(): string {
    return this._function.getFunctionId();
  }

  /**
   * The name of the deployed function.
   * @returns {string}
   */
  public name(): string {
    return this._function.getName();
  }

  public override toString(): string {
    return `${super.toString()}: functionId: ${this.functionId()}, name: ${this.name()}`;
  }
}

/**
 * Indicates that an error occurred during the put-function request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: PutFunctionResponse.Error = PutFunctionResponse.Error;

  constructor(_innerException: SdkError) {
    super(_innerException);
  }
}

export type Response = Success | Error;
