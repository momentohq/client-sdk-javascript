// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {TextDecoder} from 'util';
import {SdkError} from '../../errors/errors';
import {ResponseBase} from './response-base';
import {applyMixins, ErrorBody} from '../../errors/error-utils';

const TEXT_DECODER = new TextDecoder();

export abstract class Response extends ResponseBase {}

export class Success extends Response {
  private readonly value: Uint8Array;
  constructor(value: Uint8Array) {
    super();
    this.value = value;
  }

  public valueString(): string {
    return TEXT_DECODER.decode(this.value);
  }

  public valueBytes(): Uint8Array {
    return this.value;
  }
}

export class Error extends Response {
  protected _innerException: SdkError;
  constructor(err: SdkError) {
    super();
    this._innerException = err;
  }
} // eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Error extends ErrorBody {}
applyMixins(Error, [ErrorBody]);
