import {SdkError} from '../../errors';
import {
  BaseResponseError,
  BaseResponseMiss,
  ResponseBase,
} from './response-base';
import {CacheItemGetTypeResponse} from './enums';
import {ItemType} from '../../utils';

interface IResponse {
  value(): ItemType | undefined;
  readonly type: CacheItemGetTypeResponse;
}

/**
 * Indicates a successful item get type request.
 */
export class Hit extends ResponseBase implements IResponse {
  readonly type: CacheItemGetTypeResponse.Hit = CacheItemGetTypeResponse.Hit;
  private readonly keyType: ItemType;

  constructor(keyType: ItemType) {
    super();
    this.keyType = keyType;
  }

  /**
   * Returns the type of key.
   * @returns {ItemType}
   */
  public value(): ItemType {
    return this.keyType;
  }

  /**
   * Returns the type of key.
   * @returns {ItemType}
   */
  public itemType(): ItemType {
    return this.keyType;
  }

  public override toString(): string {
    return `${super.toString()}: item type: ${this.keyType}`;
  }
}

/**
 * Indicates that the requested item was not available in the cache.
 */
export class Miss extends BaseResponseMiss implements IResponse {
  readonly type: CacheItemGetTypeResponse.Miss = CacheItemGetTypeResponse.Miss;

  constructor() {
    super();
  }

  value(): undefined {
    return undefined;
  }
}

/**
 * Indicates that an error occurred during the item get type request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: CacheItemGetTypeResponse.Error =
    CacheItemGetTypeResponse.Error;

  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  value(): undefined {
    return undefined;
  }
}

export type Response = Hit | Miss | Error;
