import {DeleteCacheResponse} from './delete-cache-response';
import {MomentoErrorCode, SdkError} from '../../../errors/errors';

export class Success extends DeleteCacheResponse {}

export class Error extends DeleteCacheResponse {
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
    return this._innerException.errorCode;
  }

  public toString(): string {
    return this.message();
  }
}
