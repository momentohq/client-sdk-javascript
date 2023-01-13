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

  public valueUint8Array(): Uint8Array {
    return this.value;
  }
}

export class Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Error extends ErrorBody {}
applyMixins(Error, [ErrorBody]);
