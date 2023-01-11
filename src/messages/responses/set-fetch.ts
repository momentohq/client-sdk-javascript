import {ResponseBase} from './response-base';
import {SdkError} from '../../errors/errors';
import {applyMixins, ErrorBody} from '../../errors/error-utils';
import {TextDecoder} from 'util';

const TEXT_DECODER = new TextDecoder();

export abstract class Response extends ResponseBase {}

export class Missing extends Response {}

export class Found extends Response {
  private readonly elements: Uint8Array[];

  constructor(elements: Uint8Array[]) {
    super();
    this.elements = elements;
  }

  public valueSetString() {
    return new Set(this.elements.map(e => TEXT_DECODER.decode(e)));
  }

  public valueSetByteArray(): Set<Uint8Array> {
    return new Set(this.elements);
  }
}

export class Success extends Response {}

export class Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Error extends ErrorBody {}
applyMixins(Error, [ErrorBody]);
