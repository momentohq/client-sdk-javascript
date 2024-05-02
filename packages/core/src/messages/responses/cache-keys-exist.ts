import {SdkError} from '../../errors';
import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';

const TEXT_DECODER = new TextDecoder();

/**
 * Parent response type for a cache keys exist request. The
 * response object is resolved to a type-safe object of one of
 * the following subtypes:
 *
 * - {Success}
 * - {Error}
 *
 * `instanceof` type guards can be used to operate on the appropriate subtype.
 * @example
 * For example:
 * ```
 * if (response instanceof CacheKeysExist.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CacheKeysExist.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

class _Success extends Response {
  private readonly _fields: Uint8Array[];
  private readonly _exists: boolean[];

  constructor(fields: Uint8Array[], exists: boolean[]) {
    super();
    this._fields = fields;
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
   * A record of key-value pairs indicating whether each given key was found in the cache.
   * @returns {Record<string, boolean>}
   */
  public valueRecord(): Record<string, boolean> {
    const record: Record<string, boolean> = {};
    this._fields.forEach((field, index) => {
      record[TEXT_DECODER.decode(field)] = this._exists[index];
    });
    return record;
  }

  public override toString(): string {
    const booleans = this._exists.map(bool => bool);
    return super.toString() + ': exists: ' + booleans.join(', ');
  }
}

/**
 * Indicates a Successful cache keys exist request.
 */
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the cache keys exist request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
