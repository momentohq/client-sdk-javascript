// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {TextDecoder, TextEncoder} from 'util';
import {SdkError} from '../../errors/errors';
import {
  ResponseBase,
  ResponseError,
  ResponseHit,
  ResponseMiss,
} from './response-base';
import {truncateString} from '../../internal/utils/display';

const TEXT_DECODER = new TextDecoder();
const TEXT_ENCODER = new TextEncoder();

export abstract class Response extends ResponseBase {
  public hitOrElse(fallback: () => Uint8Array | string): Hit {
    if (this instanceof Hit) {
      return this;
    }
    const value = fallback();
    if (value instanceof Uint8Array) {
      return new Hit(value);
    } else {
      return new Hit(TEXT_ENCODER.encode(value));
    }
  }
}

class _Hit extends Response {
  private readonly body: Uint8Array;
  constructor(body: Uint8Array) {
    super();
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
export class Hit extends ResponseHit(_Hit) {}

class _Miss extends Response {}
export class Miss extends ResponseMiss(_Miss) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}
export class Error extends ResponseError(_Error) {}
