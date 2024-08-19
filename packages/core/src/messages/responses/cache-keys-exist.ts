import {SdkError} from '../../errors';
import {BaseResponseError, BaseResponseSuccess} from './response-base';
import {CacheKeysExistResponse} from './enums';

const TEXT_DECODER = new TextDecoder();

interface IResponse {
  exists(): boolean[] | undefined;
  readonly type: CacheKeysExistResponse;
}

/**
 * Indicates a successful keys exist request.
 */
export class Success extends BaseResponseSuccess implements IResponse {
  readonly type: CacheKeysExistResponse.Success =
    CacheKeysExistResponse.Success;

  private readonly _keys: Uint8Array[];
  private readonly _exists: boolean[];

  constructor(keys: Uint8Array[], exists: boolean[]) {
    super();
    this._keys = keys;
    this._exists = exists;
  }

  /**
   * A list of booleans indicating whether each given key was found in the cache.
   * @returns {boolean[]}
   */
  public exists(): boolean[] {
    return this._exists;
  }

  /**
   * A record of key-exists pairs indicating whether each given key was found in the cache.
   * @returns {Record<string, boolean>}
   */
  public valueRecord(): Record<string, boolean> {
    return this._keys.reduce<Record<string, boolean>>((acc, field, index) => {
      acc[TEXT_DECODER.decode(field)] = this._exists[index];
      return acc;
    }, {});
  }

  public override toString(): string {
    const booleans = this._exists.map(bool => bool);
    return super.toString() + ': exists: ' + booleans.join(', ');
  }
}

/**
 * Indicates that an error occurred during the keys exist request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: CacheKeysExistResponse.Error = CacheKeysExistResponse.Error;

  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  exists(): undefined {
    return;
  }
}

export type Response = Success | Error;
