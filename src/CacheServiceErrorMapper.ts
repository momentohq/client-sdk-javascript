import {Status} from '@grpc/grpc-js/build/src/constants';
import {ServiceError} from '@grpc/grpc-js';
import {
  CacheNotFoundError,
  CacheServiceError,
  InternalServerError,
  PermissionDeniedError,
  ServiceValidationError,
} from './Errors';

export function cacheServiceErrorMapper(
  err: ServiceError | null
): CacheServiceError {
  if (err?.code === Status.PERMISSION_DENIED) {
    return new PermissionDeniedError(err.message);
  }
  if (err?.code === Status.INVALID_ARGUMENT) {
    return new ServiceValidationError(err.message);
  }
  if (err?.code === Status.NOT_FOUND) {
    return new CacheNotFoundError(err.message);
  }
  return new InternalServerError('unable to process request');
}
