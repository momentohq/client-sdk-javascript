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
import {RpcError, StatusCode} from 'grpc-web';

export class CacheServiceErrorMapper {
  private readonly throwOnErrors: boolean;

  constructor(throwOnErrors: boolean) {
    this.throwOnErrors = throwOnErrors;
  }

  handleError(
    err: RpcError | null,
    errorResponseFactoryFn: (err: SdkError) => unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolveFn: (result: any) => void,
    rejectFn: (err: SdkError) => void
  ): void {
    const error = this.convertError(err);
    if (this.throwOnErrors) {
      rejectFn(error);
    } else {
      resolveFn(errorResponseFactoryFn(error));
    }
  }

  convertError(err: RpcError | null): SdkError {
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
      case StatusCode.NOT_FOUND:
        return new NotFoundError(...errParams);
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
      case StatusCode.ALREADY_EXISTS:
        return new AlreadyExistsError(...errParams);
      default:
        return new UnknownError(...errParams);
    }
  }
}
