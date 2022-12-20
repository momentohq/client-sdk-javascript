// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {TextDecoder} from 'util';
import {MomentoErrorCode, SdkError} from '../../errors/errors';
import {ResponseBase} from './response-base';

const TEXT_DECODER = new TextDecoder();

export abstract class Response extends ResponseBase {}

export class Hit extends Response {
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

  public valueBytes(): Uint8Array {
    return this.body;
  }

  public override toString(): string {
    if (this.valueString().length > 32) {
      return this.valueString().substring(0, 32) + '...';
    }
    return super.toString() + ': ' + this.valueString();
  }
}

export class Miss extends Response {}

export class Error extends Response {
  private readonly _innerException: SdkError;
  constructor(err: SdkError) {
    super();
    this._innerException = err;
  }

  public message(): string {
    return this._innerException.wrappedErrorMessage();
  }

  public innerException(): object {
    return this._innerException;
  }

  public errorCode(): MomentoErrorCode {
    return this._innerException.errorCode();
  }

  public override toString(): string {
    return super.toString() + ': ' + this.message();
  }
}
