// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import * as GetValue from './response-get-value';
import {TextDecoder} from 'util';
import {SdkError} from '../../errors/errors';

const TEXT_DECODER = new TextDecoder();

export abstract class Response extends GetValue.Response {}

export class Hit extends GetValue.Hit {
  private readonly field: Uint8Array;

  constructor(body: Uint8Array, field: Uint8Array) {
    super(body);
    this.field = field;
  }

  public fieldString(): string {
    return TEXT_DECODER.decode(this.field);
  }

  public fieldUint8Array(): Uint8Array {
    return this.field;
  }
}

export class Miss extends GetValue.Miss {
  private readonly field: Uint8Array;

  constructor(field: Uint8Array) {
    super();
    this.field = field;
  }

  public fieldString(): string {
    return TEXT_DECODER.decode(this.field);
  }

  public fieldUint8Array(): Uint8Array {
    return this.field;
  }
}

export class Error extends GetValue.Error {
  private readonly field: Uint8Array;

  constructor(protected _innerException: SdkError, field: Uint8Array) {
    super(_innerException);
    this.field = field;
  }

  public fieldString(): string {
    return TEXT_DECODER.decode(this.field);
  }

  public fieldUint8Array(): Uint8Array {
    return this.field;
  }
}
