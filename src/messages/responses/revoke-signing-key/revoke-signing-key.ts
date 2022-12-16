import {RevokeSigningKeyResponse} from './revoke-signing-key-response';
import {MomentoErrorCode, SdkError} from '../../../errors/errors';

export class Success extends RevokeSigningKeyResponse {}

export class Error extends RevokeSigningKeyResponse {
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
