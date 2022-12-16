import {CacheDeleteResponse} from './cache-delete-response';
import {MomentoErrorCode, SdkError} from '../../../errors/errors';
export class Success extends CacheDeleteResponse {}

export class Error extends CacheDeleteResponse {
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
