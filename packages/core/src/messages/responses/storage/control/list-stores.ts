import {ListStoresResponse} from '../../enums';
import {BaseResponseError, BaseResponseSuccess} from '../../response-base';
import {StoreInfo} from '../../../store-info';
import {SdkError} from '../../../../errors';

interface IResponse {
  readonly type: ListStoresResponse;
}

/**
 * Indicates a successful list stores request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: ListStoresResponse.Success = ListStoresResponse.Success;
  private readonly _stores: StoreInfo[];

  constructor(stores: StoreInfo[]) {
    super();
    this._stores = stores;
  }

  /**
   * An array of StoreInfo, containing information about each store.
   * @returns {StoreInfo[]}
   */
  public stores(): StoreInfo[] {
    return this._stores;
  }

  public override toString() {
    const _stores = this._stores.map(storeInfo => storeInfo.getName());
    return super.toString() + ': ' + _stores.join(', ');
  }
}

/**
 * Indicates that an error occurred during the list stores request.
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

  readonly type: ListStoresResponse.Error = ListStoresResponse.Error;
}

export type Response = Success | Error;
