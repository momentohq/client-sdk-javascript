import {CreateStoreResponse} from '../../enums';
import {BaseResponseError, BaseResponseSuccess} from '../../response-base';
import {SdkError} from '../../../../errors';

interface IResponse {
  readonly type: CreateStoreResponse;
}

/**
 * Indicates a successful create store request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: CreateStoreResponse.Success = CreateStoreResponse.Success;
}

/**
 * Indicates that the store already exists.
 */
export class AlreadyExists extends BaseResponseSuccess implements IResponse {
  readonly type: CreateStoreResponse.AlreadyExists =
    CreateStoreResponse.AlreadyExists;
}

/**
 * Indicates that an error occurred during the create store request.
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

  readonly type: CreateStoreResponse.Error = CreateStoreResponse.Error;
}

export type Response = Success | AlreadyExists | Error;
