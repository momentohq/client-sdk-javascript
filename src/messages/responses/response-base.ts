import {MomentoErrorCode, SdkError} from '../../errors/errors';

export abstract class Response {
  public toString(): string {
    return this.constructor.name;
  }
}

export interface IListResponseSuccess {
  listLength(): number;
}

export class Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
    this._innerException = _innerException;
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

  public toString(): string {
    return this.message();
  }
}

export class Hit extends Response {}

export class Miss extends Response {}

export class Success extends Response {}
