import {DeleteCacheResponse} from './delete-cache-response';
import {MomentoErrorCode, SdkError} from '../../../errors/errors';

export class Success extends DeleteCacheResponse {}

export class Error extends DeleteCacheResponse {
  private readonly _innerException: SdkError;
  constructor(err: SdkError) {
    super();
    this._innerException = err;
  }

  public message(): string {
    // TODO: Add messageWrapper to the error classes
    return this._innerException.message;
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
