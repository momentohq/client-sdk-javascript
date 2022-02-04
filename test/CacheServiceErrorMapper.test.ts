import {Status} from '@grpc/grpc-js/build/src/constants';
import {cacheServiceErrorMapper} from '../src/CacheServiceErrorMapper';
import {Metadata, ServiceError} from '@grpc/grpc-js';
import {
  NotFoundError,
  InternalServerError,
  PermissionError,
  BadRequestError,
  CancelledError,
  TimeoutError,
  AuthenticationError,
  LimitExceededError,
  AlreadyExistsError,
} from '../src/Errors';

const generateServiceError = (status: Status): ServiceError => {
  return {
    metadata: new Metadata(),
    details: '',
    message: '',
    name: '',
    code: status,
  };
};

describe('CacheServiceErrorMapper', () => {
  it('should return permission denied error when Status.PERMISSION_DENIED', () => {
    const serviceError = generateServiceError(Status.PERMISSION_DENIED);
    const res = cacheServiceErrorMapper(serviceError);
    expect(res).toBeInstanceOf(PermissionError);
  });
  it('should return bad request error when grpc status is INVALID_ARGUMENT, OUT_OF_RANGE, UNIMPLEMENTED, FAILED_PRECONDITION', () => {
    const serviceErrors = [
      generateServiceError(Status.INVALID_ARGUMENT),
      generateServiceError(Status.OUT_OF_RANGE),
      generateServiceError(Status.UNIMPLEMENTED),
      generateServiceError(Status.FAILED_PRECONDITION),
    ];
    serviceErrors.forEach(e => {
      const res = cacheServiceErrorMapper(e);
      expect(res).toBeInstanceOf(BadRequestError);
    });
  });
  it('should return cache not found error when grpc status is NOT_FOUND', () => {
    const serviceError = generateServiceError(Status.NOT_FOUND);
    const res = cacheServiceErrorMapper(serviceError);
    expect(res).toBeInstanceOf(NotFoundError);
  });
  it('should return internal server error when grpc status is DATA_LOSS, INTERNAL, UNKNOWN, ABORTED, UNAVAILABLE', () => {
    const serviceErrors = [
      generateServiceError(Status.DATA_LOSS),
      generateServiceError(Status.INTERNAL),
      generateServiceError(Status.UNKNOWN),
      generateServiceError(Status.ABORTED),
      generateServiceError(Status.UNAVAILABLE),
    ];
    serviceErrors.forEach(e => {
      const res = cacheServiceErrorMapper(e);
      expect(res).toBeInstanceOf(InternalServerError);
    });
  });
  it('should return cache not found error when grpc status is CANCELLED', () => {
    const serviceError = generateServiceError(Status.CANCELLED);
    const res = cacheServiceErrorMapper(serviceError);
    expect(res).toBeInstanceOf(CancelledError);
  });
  it('should return cache not found error when grpc status is DEADLINE_EXCEEDED', () => {
    const serviceError = generateServiceError(Status.DEADLINE_EXCEEDED);
    const res = cacheServiceErrorMapper(serviceError);
    expect(res).toBeInstanceOf(TimeoutError);
  });
  it('should return cache not found error when grpc status is UNAUTHENTICATED', () => {
    const serviceError = generateServiceError(Status.UNAUTHENTICATED);
    const res = cacheServiceErrorMapper(serviceError);
    expect(res).toBeInstanceOf(AuthenticationError);
  });
  it('should return cache not found error when grpc status is RESOURCE_EXHAUSTED', () => {
    const serviceError = generateServiceError(Status.RESOURCE_EXHAUSTED);
    const res = cacheServiceErrorMapper(serviceError);
    expect(res).toBeInstanceOf(LimitExceededError);
  });
  it('should return cache not found error when grpc status is ALREADY_EXISTS', () => {
    const serviceError = generateServiceError(Status.ALREADY_EXISTS);
    const res = cacheServiceErrorMapper(serviceError);
    expect(res).toBeInstanceOf(AlreadyExistsError);
  });
});
