import {Status} from '@grpc/grpc-js/build/src/constants';
import {ServiceError} from '@grpc/grpc-js';
import {
  NotFoundError,
  InternalServerError,
  InvalidArgumentError,
  PermissionError,
  BadRequestError,
  CancelledError,
  TimeoutError,
  AuthenticationError,
  LimitExceededError,
  AlreadyExistsError,
  SdkError,
  UnknownServiceError,
  ServerUnavailableError,
  UnknownError,
  FailedPreconditionError,
} from '../../src';
import {
  ICacheServiceErrorMapper,
  ResolveOrRejectErrorOptions,
} from '@gomomento/sdk-core/dist/src/errors/ICacheServiceErrorMapper';

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
    const errParams: [
      string,
      number | undefined,
      object | undefined,
      string | undefined
    ] = [
      err?.message || 'Unable to process request',
      err?.code,
      err?.metadata,
      err?.stack,
    ];
    switch (err?.code) {
      case Status.PERMISSION_DENIED:
        return new PermissionError(...errParams);
      case Status.DATA_LOSS:
      case Status.INTERNAL:
      case Status.ABORTED:
        return new InternalServerError(...errParams);
      case Status.UNKNOWN:
        return new UnknownServiceError(...errParams);
      case Status.UNAVAILABLE:
        return new ServerUnavailableError(...errParams);
      case Status.NOT_FOUND:
        return new NotFoundError(...errParams);
      case Status.OUT_OF_RANGE:
      case Status.UNIMPLEMENTED:
        return new BadRequestError(...errParams);
      case Status.FAILED_PRECONDITION:
        return new FailedPreconditionError(...errParams);
      case Status.INVALID_ARGUMENT:
        return new InvalidArgumentError(...errParams);
      case Status.CANCELLED:
        return new CancelledError(...errParams);
      case Status.DEADLINE_EXCEEDED:
        return new TimeoutError(...errParams);
      case Status.UNAUTHENTICATED:
        return new AuthenticationError(...errParams);
      case Status.RESOURCE_EXHAUSTED:
        return new LimitExceededError(...errParams);
      case Status.ALREADY_EXISTS:
        return new AlreadyExistsError(...errParams);
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
