import {Status} from '@grpc/grpc-js/build/src/constants';
import {cacheServiceErrorMapper} from '../../src/errors/cache-service-error-mapper';
import {Metadata, ServiceError} from '@grpc/grpc-js';
import {
  AlreadyExistsError,
  AuthenticationError,
  BadRequestError,
  CancelledError,
  FailedPreconditionError,
  InternalServerError,
  InvalidArgumentError,
  LimitExceededError,
  NotFoundError,
  PermissionError,
  ServerUnavailableError,
  TimeoutError,
  UnknownServiceError,
} from '../../src';

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
  it('should return invalid argument error when grpc status is INVALID_ARGUMENT', () => {
    const serviceError = generateServiceError(Status.INVALID_ARGUMENT);
    const res = cacheServiceErrorMapper(serviceError);
    expect(res).toBeInstanceOf(InvalidArgumentError);
  });
  it('should return failed precondition error when grpc status is FAILED_PRECONDITION', () => {
    const serviceError = generateServiceError(Status.FAILED_PRECONDITION);
    const res = cacheServiceErrorMapper(serviceError);
    expect(res).toBeInstanceOf(FailedPreconditionError);
  });
  it('should return bad request error when grpc status is OUT_OF_RANGE or UNIMPLEMENTED', () => {
    const serviceErrors = [
      generateServiceError(Status.OUT_OF_RANGE),
      generateServiceError(Status.UNIMPLEMENTED),
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
  it('should return unavailable error when grpc status is UNAVAILABLE', () => {
    const serviceError = generateServiceError(Status.UNAVAILABLE);
    const res = cacheServiceErrorMapper(serviceError);
    expect(res).toBeInstanceOf(ServerUnavailableError);
  });
  it('should return unknown service error when grpc status is UNKNOWN', () => {
    const serviceError = generateServiceError(Status.UNKNOWN);
    const res = cacheServiceErrorMapper(serviceError);
    expect(res).toBeInstanceOf(UnknownServiceError);
  });
  it('should return internal server error when grpc status is DATA_LOSS, INTERNAL, ABORTED', () => {
    const serviceErrors = [
      generateServiceError(Status.DATA_LOSS),
      generateServiceError(Status.INTERNAL),
      generateServiceError(Status.ABORTED),
    ];
    serviceErrors.forEach(e => {
      const res = cacheServiceErrorMapper(e);
      expect(res).toBeInstanceOf(InternalServerError);
    });
  });
  it('should return cancelled error when grpc status is CANCELLED', () => {
    const serviceError = generateServiceError(Status.CANCELLED);
    const res = cacheServiceErrorMapper(serviceError);
    expect(res).toBeInstanceOf(CancelledError);
  });
  it('should return timeout error when grpc status is DEADLINE_EXCEEDED', () => {
    const serviceError = generateServiceError(Status.DEADLINE_EXCEEDED);
    const res = cacheServiceErrorMapper(serviceError);
    expect(res).toBeInstanceOf(TimeoutError);
  });
  it('should return authentication error when grpc status is UNAUTHENTICATED', () => {
    const serviceError = generateServiceError(Status.UNAUTHENTICATED);
    const res = cacheServiceErrorMapper(serviceError);
    expect(res).toBeInstanceOf(AuthenticationError);
  });
  it('should return limit exceeded error when grpc status is RESOURCE_EXHAUSTED', () => {
    const serviceError = generateServiceError(Status.RESOURCE_EXHAUSTED);
    const res = cacheServiceErrorMapper(serviceError);
    expect(res).toBeInstanceOf(LimitExceededError);
  });
  it('should return already exists error when grpc status is ALREADY_EXISTS', () => {
    const serviceError = generateServiceError(Status.ALREADY_EXISTS);
    const res = cacheServiceErrorMapper(serviceError);
    expect(res).toBeInstanceOf(AlreadyExistsError);
  });
});
