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
} from './errors';

export function cacheServiceErrorMapper(err: ServiceError | null): SdkError {
  switch (err?.code) {
    case Status.PERMISSION_DENIED:
      return new PermissionError(
        err?.message,
        err?.code,
        err?.metadata,
        err?.stack
      );
    case Status.DATA_LOSS:
    case Status.INTERNAL:
    case Status.ABORTED:
      return new InternalServerError(
        err?.message,
        err?.code,
        err?.metadata,
        err?.stack
      );
    case Status.UNKNOWN:
      return new UnknownServiceError(
        err?.message,
        err?.code,
        err?.metadata,
        err?.stack
      );
    case Status.UNAVAILABLE:
      return new ServerUnavailableError(
        err?.message,
        err?.code,
        err?.metadata,
        err?.stack
      );
    case Status.NOT_FOUND:
      return new NotFoundError(
        err?.message,
        err?.code,
        err?.metadata,
        err?.stack
      );
    case Status.OUT_OF_RANGE:
    case Status.UNIMPLEMENTED:
      return new BadRequestError(
        err?.message,
        err?.code,
        err?.metadata,
        err?.stack
      );
    case Status.FAILED_PRECONDITION:
    case Status.INVALID_ARGUMENT:
      return new InvalidArgumentError(
        err?.message,
        err?.code,
        err?.metadata,
        err?.stack
      );
    case Status.CANCELLED:
      return new CancelledError(
        err?.message,
        err?.code,
        err?.metadata,
        err?.stack
      );
    case Status.DEADLINE_EXCEEDED:
      return new TimeoutError(
        err?.message,
        err?.code,
        err?.metadata,
        err?.stack
      );
    case Status.UNAUTHENTICATED:
      return new AuthenticationError(
        err?.message,
        err?.code,
        err?.metadata,
        err?.stack
      );
    case Status.RESOURCE_EXHAUSTED:
      return new LimitExceededError(
        err?.message,
        err?.code,
        err?.metadata,
        err?.stack
      );
    case Status.ALREADY_EXISTS:
      return new AlreadyExistsError(
        err?.message,
        err?.code,
        err?.metadata,
        err?.stack
      );
    default:
      return new UnknownError(
        err?.message || 'unable to process request',
        err?.code,
        err?.metadata,
        err?.stack
      );
  }
}
