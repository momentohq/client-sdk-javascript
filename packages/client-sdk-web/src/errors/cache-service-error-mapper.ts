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
import {Metadata, RpcError, StatusCode} from 'grpc-web';
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
    const errParams: [
      string,
      number | undefined,
      Metadata | undefined,
      string | undefined
    ] = [
      err?.message || 'Unable to process request',
      err?.code,
      err?.metadata,
      err?.stack,
    ];
    switch (err?.code) {
      case StatusCode.PERMISSION_DENIED:
        return new PermissionError(...errParams);
      case StatusCode.DATA_LOSS:
      case StatusCode.INTERNAL:
      case StatusCode.ABORTED:
        return new InternalServerError(...errParams);
      case StatusCode.UNKNOWN:
        return new UnknownServiceError(...errParams);
      case StatusCode.UNAVAILABLE:
        return new ServerUnavailableError(...errParams);
      case StatusCode.NOT_FOUND: {
        const errCause = errParams[2]?.['err']?.[0];
        switch (errCause) {
          case 'item_not_found':
            return new StoreItemNotFoundError(...errParams);
          case 'store_not_found':
            return new StoreNotFoundError(...errParams);
          default:
            return new CacheNotFoundError(...errParams);
        }
      }
      case StatusCode.OUT_OF_RANGE:
      case StatusCode.UNIMPLEMENTED:
        return new BadRequestError(...errParams);
      case StatusCode.FAILED_PRECONDITION:
        return new FailedPreconditionError(...errParams);
      case StatusCode.INVALID_ARGUMENT:
        return new InvalidArgumentError(...errParams);
      case StatusCode.CANCELLED:
        return new CancelledError(...errParams);
      case StatusCode.DEADLINE_EXCEEDED:
        return new TimeoutError(...errParams);
      case StatusCode.UNAUTHENTICATED:
        return new AuthenticationError(...errParams);
      case StatusCode.RESOURCE_EXHAUSTED:
        return new LimitExceededError(...errParams);
      case StatusCode.ALREADY_EXISTS: {
        const errCause = errParams[2]?.['err']?.[0];
        switch (errCause) {
          case 'store_already_exists':
            return new StoreAlreadyExistsError(...errParams);
          default:
            return new CacheAlreadyExistsError(...errParams);
        }
      }
      default:
        return new UnknownError(...errParams);
    }
  }
}

function normalizeSdkError(error: Error): SdkError {
  if (error instanceof SdkError) {
    return error;
  }
  return new UnknownError(error.message);
}
