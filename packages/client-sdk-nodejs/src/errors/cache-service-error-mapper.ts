import {Status} from '@grpc/grpc-js/build/src/constants';
import {ServiceError} from '@grpc/grpc-js';
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
import {
  CacheNotFoundError,
  SdkErrorProps,
  StoreItemNotFoundError,
  StoreNotFoundError,
} from '@gomomento/sdk-core/dist/src/errors';
import {
  ICacheServiceErrorMapper,
  ResolveOrRejectErrorOptions,
} from '@gomomento/sdk-core/dist/src/errors/ICacheServiceErrorMapper';
import {
  CacheAlreadyExistsError,
  StoreAlreadyExistsError,
} from '@gomomento/sdk-core';

export class CacheServiceErrorMapper
  implements ICacheServiceErrorMapper<ServiceError>
{
  private readonly throwOnErrors: boolean;

  constructor(throwOnError: boolean) {
    this.throwOnErrors = throwOnError;
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

  resolveOrRejectError(opts: ResolveOrRejectErrorOptions<ServiceError>): void {
    const error = this.convertError(opts.err);

    if (this.throwOnErrors) {
      opts.rejectFn(error);
    } else {
      opts.resolveFn(opts.errorResponseFactoryFn(error));
    }
  }

  convertError(err: ServiceError | null): SdkError {
    const message = err?.message || 'Unable to process request';
    const sdkErrorProps: SdkErrorProps = {
      code: err?.code,
      metadata: err?.metadata,
      stack: err?.stack,
    };
    switch (err?.code) {
      case Status.PERMISSION_DENIED:
        return new PermissionError(message, sdkErrorProps);
      case Status.DATA_LOSS:
      case Status.INTERNAL:
      case Status.ABORTED:
        return new InternalServerError(message, sdkErrorProps);
      case Status.UNKNOWN:
        return new UnknownServiceError(message, sdkErrorProps);
      case Status.UNAVAILABLE:
        return new ServerUnavailableError(message, sdkErrorProps);
      case Status.NOT_FOUND: {
        let errCause = err?.metadata?.get('err')?.[0];
        // TODO: Remove this once the error message is standardized on the server side
        const errorMessage = err?.message?.toString();
        const isStoreNotFound =
          errorMessage?.includes('Store with name:') &&
          errorMessage?.includes("doesn't exist");
        // If errCause is not already set to 'store_not_found', check for store_not_found error
        if (!errCause && isStoreNotFound) {
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
      case Status.OUT_OF_RANGE:
      case Status.UNIMPLEMENTED:
        return new BadRequestError(message, sdkErrorProps);
      case Status.FAILED_PRECONDITION:
        return new FailedPreconditionError(message, sdkErrorProps);
      case Status.INVALID_ARGUMENT:
        return new InvalidArgumentError(message, sdkErrorProps);
      case Status.CANCELLED:
        return new CancelledError(message, sdkErrorProps);
      case Status.DEADLINE_EXCEEDED:
        return new TimeoutError(message, sdkErrorProps);
      case Status.UNAUTHENTICATED:
        return new AuthenticationError(message, sdkErrorProps);
      case Status.RESOURCE_EXHAUSTED:
        return new LimitExceededError(message, sdkErrorProps);
      case Status.ALREADY_EXISTS: {
        let errCause = err?.metadata?.get('err')?.[0];
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
