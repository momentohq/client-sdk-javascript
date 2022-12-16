import {CreateCacheResponse} from './create-cache-response';
import {MomentoErrorCode, SdkError} from '../../../errors/errors';

export class Success extends CreateCacheResponse {}

export class AlreadyExists extends CreateCacheResponse {}

export class Error extends CreateCacheResponse {
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
    return this._innerException.errorCode;
  }

  public override toString(): string {
    return super.toString() + ': ' + this.message();
  }
}
