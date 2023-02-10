// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {TextDecoder} from 'util';
import {SdkError} from '../../errors/errors';
import {
  ResponseBase,
  ResponseError,
  ResponseHit,
  ResponseMiss,
} from './response-base';
import {truncateString} from '../../internal/utils/display';

const TEXT_DECODER = new TextDecoder();

export abstract class Response extends ResponseBase {
  protected readonly field: Uint8Array;

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

  public hitOrElse<T>(hitFn: (h: Hit) => T, elseFn: () => T): T {
    if (this instanceof Hit) {
      return hitFn(this);
    } else {
      return elseFn();
    }
  }
}

class _Hit extends Response {
  private readonly body: Uint8Array;
  constructor(body: Uint8Array, field: Uint8Array) {
    super(field);
    this.body = body;
  }
  /**
   * decodes the body into a utf-8 string
   * @returns string
   */
  public valueString(): string {
    return TEXT_DECODER.decode(this.body);
  }

  public valueUint8Array(): Uint8Array {
    return this.body;
  }

  public override toString(): string {
    const display = truncateString(this.valueString());
    return `${super.toString()}: ${display}`;
  }
}
export class Hit extends ResponseHit(_Hit) {
  constructor(body: Uint8Array, field: Uint8Array) {
    super(body, field);
  }
}

class _Miss extends Response {}
export class Miss extends ResponseMiss(_Miss) {
  constructor(field: Uint8Array) {
    super(field);
  }
}

class _Error extends Response {
  constructor(protected _innerException: SdkError, field: Uint8Array) {
    super(field);
  }
}

export class Error extends ResponseError(_Error) {
  constructor(public _innerException: SdkError, field: Uint8Array) {
    super(_innerException, field);
  }
}
