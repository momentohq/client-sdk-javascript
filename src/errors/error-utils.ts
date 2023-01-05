import {MomentoErrorCode, SdkError, UnknownError} from './errors';

export function normalizeSdkError(error: Error): SdkError {
  if (error instanceof SdkError) {
    return error;
  }
  return new UnknownError(error.message);
}

export abstract class ErrorBody {
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

/**
 * This function is used by the classes in `messages.responses` to copy the
 * implementation of ErrorBody above into the identical error subtypes
 * defined in each response type.
 *
 * Because those classes *must* subclass a specific response base class, for example
 * `CacheDelete.Response`, we're using the
 * [mixin pattern](https://www.typescriptlang.org/docs/handbook/mixins.html)
 * described in the TypeScript documentation to DRY out their implementations.
 *
 * @param derivedCtor The class receiving the mixin implementations
 * @param constructors A list of classes providing the implementations
 */
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
