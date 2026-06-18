import {SdkError} from '../../../errors';
import {FunctionVersionInfo} from '../../function-info';
import {BaseResponseError, BaseResponseSuccess} from '../response-base';
import {ListFunctionVersionsResponse} from '../enums';

interface IResponse {
  readonly type: ListFunctionVersionsResponse;
}

/**
 * Indicates a successful list-function-versions request, carrying the versions of the function.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: ListFunctionVersionsResponse.Success =
    ListFunctionVersionsResponse.Success;
  private readonly _versions: FunctionVersionInfo[];

  constructor(versions: FunctionVersionInfo[]) {
    super();
    this._versions = versions;
  }

  /**
   * The versions of the function.
   * @returns {FunctionVersionInfo[]}
   */
  public getVersions(): FunctionVersionInfo[] {
    return [...this._versions];
  }

  public override toString(): string {
    return `${super.toString()}: ${this._versions.length} versions`;
  }
}

/**
 * Indicates that an error occurred during the list-function-versions request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: ListFunctionVersionsResponse.Error =
    ListFunctionVersionsResponse.Error;

  constructor(_innerException: SdkError) {
    super(_innerException);
  }
}

export type Response = Success | Error;
