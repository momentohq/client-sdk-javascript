import {Status} from '@grpc/grpc-js/build/src/constants';
import {ServiceError} from '@grpc/grpc-js';
import {
  NotFoundError,
  CacheServiceError,
  InternalServerError,
  PermissionError,
  BadRequestError,
  CancelledError,
  TimeoutError,
  AuthenticationError,
  LimitExceededError,
  AlreadyExistsError,
} from './errors';

export function cacheServiceErrorMapper(
  err: ServiceError | null
): CacheServiceError {
  switch (err?.code) {
    case Status.PERMISSION_DENIED:
      return new PermissionError(err?.message);
    case Status.DATA_LOSS:
    case Status.INTERNAL:
    case Status.UNKNOWN:
    case Status.ABORTED:
    case Status.UNAVAILABLE:
      return new InternalServerError(err?.message, err?.stack || '');
    case Status.NOT_FOUND:
      return new NotFoundError(err?.message);
    case Status.OUT_OF_RANGE:
    case Status.UNIMPLEMENTED:
    case Status.FAILED_PRECONDITION:
    case Status.INVALID_ARGUMENT:
      return new BadRequestError(err?.message);
    case Status.CANCELLED:
      return new CancelledError(err?.message);
    case Status.DEADLINE_EXCEEDED:
      return new TimeoutError(err?.message);
    case Status.UNAUTHENTICATED:
      return new AuthenticationError(err?.message);
    case Status.RESOURCE_EXHAUSTED:
      return new LimitExceededError(err?.message);
    case Status.ALREADY_EXISTS:
      return new AlreadyExistsError(err?.message);
  }
  return new InternalServerError(
    err?.message || 'unable to process request',
    err?.stack || ''
  );
}
