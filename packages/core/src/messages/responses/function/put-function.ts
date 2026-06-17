import {SdkError} from '../../../errors';
import {BaseResponseError, BaseResponseSuccess} from '../response-base';
import {PutFunctionResponse} from '../enums';

interface IResponse {
  readonly type: PutFunctionResponse;
}

/**
 * Indicates a successful put-function request. The function is created, or updated if one already exists with
 * the same cache + name (each update creates a new version); the returned id identifies the deployed function.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: PutFunctionResponse.Success = PutFunctionResponse.Success;
  private readonly _functionId: string;
  private readonly _name: string;

  constructor(functionId: string, name: string) {
    super();
    this._functionId = functionId;
    this._name = name;
  }

  /**
   * The id of the deployed function.
   * @returns {string}
   */
  public functionId(): string {
    return this._functionId;
  }

  /**
   * The name of the deployed function.
   * @returns {string}
   */
  public name(): string {
    return this._name;
  }

  public override toString(): string {
    return `${super.toString()}: functionId: ${this._functionId}, name: ${
      this._name
    }`;
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
