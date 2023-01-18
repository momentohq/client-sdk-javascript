import {MomentoErrorCode, SdkError} from '../../errors/errors';

export abstract class ResponseBase {
  public toString(): string {
    return this.constructor.name;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
type Constructor = new (...args: any[]) => {};

export interface IResponseError {
  message(): string;
  innerException(): object;
  errorCode(): MomentoErrorCode;
  toString(): string;
}

export function ResponseError<TBase extends Constructor>(Base: TBase) {
  return class ResponseError extends Base {
    public _innerException: SdkError;

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
  };
}

export function ResponseHit<TBase extends Constructor>(Base: TBase) {
  return class ResponseHit extends Base {};
}

export function ResponseMiss<TBase extends Constructor>(Base: TBase) {
  return class ResponseMiss extends Base {};
}

export function ResponseSuccess<TBase extends Constructor>(Base: TBase) {
  return class ResponseSuccess extends Base {};
}
