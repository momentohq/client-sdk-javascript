// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {TextDecoder} from 'util';
import {SdkError} from '../../errors/errors';
import {
  ResponseBase,
  ResponseHit,
  ResponseMiss,
  ResponseError,
} from './response-base';

const TEXT_DECODER = new TextDecoder();

export abstract class Response extends ResponseBase {}

class _Hit extends Response {
  private readonly body: Uint8Array;
  private readonly field: Uint8Array;

  constructor(body: Uint8Array, field: Uint8Array) {
    super();
    this.body = body;
    this.field = field;
  }
  /**
   * decodes the body into a utf-8 string
   * @returns string
   */
  public valueString(): string {
    return TEXT_DECODER.decode(this.body);
  }

  public fieldString(): string {
    return TEXT_DECODER.decode(this.field);
  }

  public valueUint8Array(): Uint8Array {
    return this.body;
  }

  public fieldUint8Array(): Uint8Array {
    return this.field;
  }

  public override toString(): string {
    if (this.valueString().length > 32) {
      return this.valueString().substring(0, 32) + '...';
    }
    return super.toString() + ': ' + this.valueString();
  }
}
export class Hit extends ResponseHit(_Hit) {}

class _Miss extends Response {
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
export class Miss extends ResponseMiss(_Miss) {}

class _Error extends Response {
  private readonly field: Uint8Array;

  constructor(protected _innerException: SdkError, field: Uint8Array) {
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
export class Error extends ResponseError(_Error) {}
