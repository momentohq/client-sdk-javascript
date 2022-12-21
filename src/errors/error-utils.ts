import {MomentoErrorCode, SdkError} from './errors';

export class ErrorConstructor {
  protected _innerException: SdkError;
  constructor(err: SdkError) {
    this._innerException = err;
  }
}

export class ErrorBody {
  protected _innerException: SdkError;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach(baseCtor => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      Object.defineProperty(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        derivedCtor.prototype,
        name,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
          Object.create(null)
      );
    });
  });
}
