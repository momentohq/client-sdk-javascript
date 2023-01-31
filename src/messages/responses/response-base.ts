import {MomentoErrorCode, SdkError} from '../../errors/errors';

export abstract class ResponseBase {
  public toString(): string {
    return this.constructor.name;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
type Constructor = new (...args: any[]) => {};

// These interfaces allow us to identify responses by their mixins.
// They are only used to make shared tests work.
// They are not for public consumption.
export interface IResponseError {
  message(): string;
  innerException(): object;
  errorCode(): MomentoErrorCode;
  toString(): string;
}

export interface IResponseSuccess {
  is_success: boolean;
}

export interface IResponseMiss {
  is_miss: boolean;
}

export interface IListResponseSuccess {
  listLength(): number;
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
  return class ResponseMiss extends Base {
    public readonly is_miss: boolean = true;
  };
}

export function ResponseSuccess<TBase extends Constructor>(Base: TBase) {
  return class ResponseSuccess extends Base {
    public readonly is_success: boolean = true;
  };
}
