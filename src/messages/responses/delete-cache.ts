import {MomentoErrorCode, SdkError} from '../../errors/errors';
import {ResponseBase} from './response-base';

export abstract class Response extends ResponseBase {}

export class Success extends Response {}

export class Error extends Response {
  public readonly _innerException: SdkError;
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
