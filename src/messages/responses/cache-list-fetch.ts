import {SdkError} from '../../errors/errors';
import {ResponseBase} from './response-base';
import {applyMixins, ErrorBody} from '../../errors/error-utils';
import {TextDecoder} from 'util';

const TEXT_DECODER = new TextDecoder();

export abstract class Response extends ResponseBase {}

export class Hit extends Response {
  private readonly _values: Uint8Array[];
  constructor(values: Uint8Array[]) {
    super();
    this._values = values;
  }

  public valueListUint8Array(): Uint8Array[] {
    return this._values;
  }

  public valueListString(): string[] {
    return this._values.map(v => TEXT_DECODER.decode(v));
  }

  public override toString(): string {
    return `${super.toString()}: ${this._values.length} items`;
  }
}

export class Miss extends Response {}

export class Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Error extends ErrorBody {}
applyMixins(Error, [ErrorBody]);
