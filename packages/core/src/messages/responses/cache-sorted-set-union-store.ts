import {SdkError} from '../../errors';
import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {CacheSortedSetUnionStoreResponse} from './enums';

interface IResponse {
  readonly type: CacheSortedSetUnionStoreResponse;
}

/**
 * Indicates a Successful sorted set union store request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: CacheSortedSetUnionStoreResponse.Success =
    CacheSortedSetUnionStoreResponse.Success;

  private readonly _length: number;
  constructor(length: number) {
    super();
    this._length = length;
  }
  /**
   * Returns the length of the sorted set
   * @returns {number}
   */
  public length(): number {
    return this._length;
  }
  public override toString(): string {
    return `${super.toString()}: length ${this._length}`;
  }
}

export class Error extends BaseResponseError implements IResponse {
  readonly type: CacheSortedSetUnionStoreResponse.Error =
    CacheSortedSetUnionStoreResponse.Error;

  constructor(error: SdkError) {
    super(error);
  }
}

export type Response = Success | Error;
