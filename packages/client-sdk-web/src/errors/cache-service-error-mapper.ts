import {
  InternalServerError,
  InvalidArgumentError,
  PermissionError,
  BadRequestError,
  CancelledError,
  TimeoutError,
  AuthenticationError,
  LimitExceededError,
  SdkError,
  UnknownServiceError,
  ServerUnavailableError,
  UnknownError,
  FailedPreconditionError,
} from '../../src';
import {RpcError, StatusCode} from 'grpc-web';
import {
  ICacheServiceErrorMapper,
  ResolveOrRejectErrorOptions,
} from '@gomomento/sdk-core/dist/src/errors/ICacheServiceErrorMapper';
import {
  CacheAlreadyExistsError,
  CacheNotFoundError,
  StoreItemNotFoundError,
  StoreAlreadyExistsError,
  StoreNotFoundError,
} from '@gomomento/sdk-core';
import {SdkErrorProps} from '@gomomento/sdk-core/dist/src/errors';

export class CacheServiceErrorMapper
  implements ICacheServiceErrorMapper<RpcError>
{
  private readonly throwOnErrors: boolean;

  constructor(throwOnErrors: boolean) {
    this.throwOnErrors = throwOnErrors;
  }

  returnOrThrowError<TErrorResponse>(
    err: Error,
    errorResponseFactoryFn: (err: SdkError) => TErrorResponse
  ): TErrorResponse {
    const sdkError = normalizeSdkError(err);
    if (this.throwOnErrors) {
      throw sdkError;
    } else {
      return errorResponseFactoryFn(sdkError);
    }
  }

  resolveOrRejectError(opts: ResolveOrRejectErrorOptions<RpcError>): void {
    const error = this.convertError(opts.err);
    if (this.throwOnErrors) {
      opts.rejectFn(error);
    } else {
      opts.resolveFn(opts.errorResponseFactoryFn(error));
    }
  }

  convertError(err: RpcError | null): SdkError {
    const message = err?.message ?? 'Unable to process request';
    const sdkErrorProps: SdkErrorProps = {
      code: err?.code,
      metadata: err?.metadata,
      stack: err?.stack,
    };
    switch (err?.code) {
      case StatusCode.PERMISSION_DENIED:
        return new PermissionError(message, sdkErrorProps);
      case StatusCode.DATA_LOSS:
      case StatusCode.INTERNAL:
      case StatusCode.ABORTED:
        return new InternalServerError(message, sdkErrorProps);
      case StatusCode.UNKNOWN:
        return new UnknownServiceError(message, sdkErrorProps);
      case StatusCode.UNAVAILABLE:
        return new ServerUnavailableError(message, sdkErrorProps);
      case StatusCode.NOT_FOUND: {
        const meta = err?.metadata ?? {};
        let errCause = meta['err'];
        // TODO: Remove this once the error message is standardized on the server side
        const errorMessage = err?.message?.toString();
        const isStoreNotFound =
          errorMessage?.includes('Store with name:') &&
          errorMessage?.includes("doesn't exist");
        if (isStoreNotFound) {
          errCause = 'store_not_found';
        }
        switch (errCause) {
          case 'item_not_found':
            return new StoreItemNotFoundError(message, sdkErrorProps);
          case 'store_not_found':
            return new StoreNotFoundError(message, sdkErrorProps);
          default:
            return new CacheNotFoundError(message, sdkErrorProps);
        }
      }
      case StatusCode.OUT_OF_RANGE:
      case StatusCode.UNIMPLEMENTED:
        return new BadRequestError(message, sdkErrorProps);
      case StatusCode.FAILED_PRECONDITION:
        return new FailedPreconditionError(message, sdkErrorProps);
      case StatusCode.INVALID_ARGUMENT:
        return new InvalidArgumentError(message, sdkErrorProps);
      case StatusCode.CANCELLED:
        return new CancelledError(message, sdkErrorProps);
      case StatusCode.DEADLINE_EXCEEDED:
        return new TimeoutError(message, sdkErrorProps);
      case StatusCode.UNAUTHENTICATED:
        return new AuthenticationError(message, sdkErrorProps);
      case StatusCode.RESOURCE_EXHAUSTED:
        return new LimitExceededError(message, sdkErrorProps);
      case StatusCode.ALREADY_EXISTS: {
        let errCause = '';
        // TODO: Remove this once the error message is standardized on the server side
        const errorMessage = err?.message?.toString();
        const isStoreAlreadyExists =
          errorMessage?.includes('Store with name:') &&
          errorMessage?.includes('already exists');
        // If errCause is not already set to 'store_already_exists', check for store_already_exists error
        if (!errCause && isStoreAlreadyExists) {
          errCause = 'store_already_exists';
        }
        switch (errCause) {
          case 'store_already_exists':
            return new StoreAlreadyExistsError(message, sdkErrorProps);
          default:
            return new CacheAlreadyExistsError(message, sdkErrorProps);
        }
      }
      default:
        return new UnknownError(message, sdkErrorProps);
    }
  }
}

function normalizeSdkError(error: Error): SdkError {
  if (error instanceof SdkError) {
    return error;
  }
  return new UnknownError(error.message);
}
