import {Status} from '@grpc/grpc-js/build/src/constants';
import {CacheServiceErrorMapper} from '../../src/errors/cache-service-error-mapper';
import {Metadata, ServiceError} from '@grpc/grpc-js';
import {
  AuthenticationError,
  BadRequestError,
  CancelledError,
  FailedPreconditionError,
  InternalServerError,
  InvalidArgumentError,
  LimitExceededError,
  PermissionError,
  SdkError,
  ServerUnavailableError,
  TimeoutError,
  UnknownServiceError,
} from '../../src';
import {CacheAlreadyExistsError, CacheNotFoundError} from '@gomomento/sdk-core';

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
  const cacheServiceErrorMapper = new CacheServiceErrorMapper(false);
  let resolved: SdkError | unknown;
  let rejected: SdkError | unknown;
  beforeEach(() => {
    resolved = undefined;
    rejected = undefined;
  });

  const errorResponseFactoryFn = (err: SdkError): never => {
    return err as never;
  };
  const resolveFn = (result: unknown) => {
    resolved = result;
  };
  const rejectFn = (err: SdkError) => {
    rejected = err;
  };

  it('should return permission denied error when Status.PERMISSION_DENIED', () => {
    const serviceError = generateServiceError(Status.PERMISSION_DENIED);
    cacheServiceErrorMapper.resolveOrRejectError({
      err: serviceError,
      errorResponseFactoryFn: errorResponseFactoryFn,
      resolveFn: resolveFn,
      rejectFn: rejectFn,
    });
    expect(resolved).toBeInstanceOf(PermissionError);
  });
  it('should return invalid argument error when grpc status is INVALID_ARGUMENT', () => {
    const serviceError = generateServiceError(Status.INVALID_ARGUMENT);
    cacheServiceErrorMapper.resolveOrRejectError({
      err: serviceError,
      errorResponseFactoryFn: errorResponseFactoryFn,
      resolveFn: resolveFn,
      rejectFn: rejectFn,
    });
    expect(resolved).toBeInstanceOf(InvalidArgumentError);
  });
  it('should return failed precondition error when grpc status is FAILED_PRECONDITION', () => {
    const serviceError = generateServiceError(Status.FAILED_PRECONDITION);
    cacheServiceErrorMapper.resolveOrRejectError({
      err: serviceError,
      errorResponseFactoryFn: errorResponseFactoryFn,
      resolveFn: resolveFn,
      rejectFn: rejectFn,
    });
    expect(resolved).toBeInstanceOf(FailedPreconditionError);
  });
  it('should return bad request error when grpc status is OUT_OF_RANGE or UNIMPLEMENTED', () => {
    const serviceErrors = [
      generateServiceError(Status.OUT_OF_RANGE),
      generateServiceError(Status.UNIMPLEMENTED),
    ];
    serviceErrors.forEach(e => {
      cacheServiceErrorMapper.resolveOrRejectError({
        err: e,
        errorResponseFactoryFn: errorResponseFactoryFn,
        resolveFn: resolveFn,
        rejectFn: rejectFn,
      });
      expect(resolved).toBeInstanceOf(BadRequestError);
    });
  });
  xit('should return cache not found error when grpc status is NOT_FOUND', () => {
    const serviceError = generateServiceError(Status.NOT_FOUND);
    cacheServiceErrorMapper.resolveOrRejectError({
      err: serviceError,
      errorResponseFactoryFn: errorResponseFactoryFn,
      resolveFn: resolveFn,
      rejectFn: rejectFn,
    });
    expect(resolved).toBeInstanceOf(CacheNotFoundError);
  });
  it('should return unavailable error when grpc status is UNAVAILABLE', () => {
    const serviceError = generateServiceError(Status.UNAVAILABLE);
    cacheServiceErrorMapper.resolveOrRejectError({
      err: serviceError,
      errorResponseFactoryFn: errorResponseFactoryFn,
      resolveFn: resolveFn,
      rejectFn: rejectFn,
    });
    expect(resolved).toBeInstanceOf(ServerUnavailableError);
  });
  it('should return unknown service error when grpc status is UNKNOWN', () => {
    const serviceError = generateServiceError(Status.UNKNOWN);
    cacheServiceErrorMapper.resolveOrRejectError({
      err: serviceError,
      errorResponseFactoryFn: errorResponseFactoryFn,
      resolveFn: resolveFn,
      rejectFn: rejectFn,
    });
    expect(resolved).toBeInstanceOf(UnknownServiceError);
  });
  it('should return internal server error when grpc status is DATA_LOSS, INTERNAL, ABORTED', () => {
    const serviceErrors = [
      generateServiceError(Status.DATA_LOSS),
      generateServiceError(Status.INTERNAL),
      generateServiceError(Status.ABORTED),
    ];
    serviceErrors.forEach(e => {
      cacheServiceErrorMapper.resolveOrRejectError({
        err: e,
        errorResponseFactoryFn: errorResponseFactoryFn,
        resolveFn: resolveFn,
        rejectFn: rejectFn,
      });
      expect(resolved).toBeInstanceOf(InternalServerError);
    });
  });
  it('should return cancelled error when grpc status is CANCELLED', () => {
    const serviceError = generateServiceError(Status.CANCELLED);
    cacheServiceErrorMapper.resolveOrRejectError({
      err: serviceError,
      errorResponseFactoryFn: errorResponseFactoryFn,
      resolveFn: resolveFn,
      rejectFn: rejectFn,
    });
    expect(resolved).toBeInstanceOf(CancelledError);
  });
  it('should return timeout error when grpc status is DEADLINE_EXCEEDED', () => {
    const serviceError = generateServiceError(Status.DEADLINE_EXCEEDED);
    cacheServiceErrorMapper.resolveOrRejectError({
      err: serviceError,
      errorResponseFactoryFn: errorResponseFactoryFn,
      resolveFn: resolveFn,
      rejectFn: rejectFn,
    });
    expect(resolved).toBeInstanceOf(TimeoutError);
  });
  it('should return authentication error when grpc status is UNAUTHENTICATED', () => {
    const serviceError = generateServiceError(Status.UNAUTHENTICATED);
    cacheServiceErrorMapper.resolveOrRejectError({
      err: serviceError,
      errorResponseFactoryFn: errorResponseFactoryFn,
      resolveFn: resolveFn,
      rejectFn: rejectFn,
    });
    expect(resolved).toBeInstanceOf(AuthenticationError);
  });
  it('should return limit exceeded error when grpc status is RESOURCE_EXHAUSTED', () => {
    const serviceError = generateServiceError(Status.RESOURCE_EXHAUSTED);
    cacheServiceErrorMapper.resolveOrRejectError({
      err: serviceError,
      errorResponseFactoryFn: errorResponseFactoryFn,
      resolveFn: resolveFn,
      rejectFn: rejectFn,
    });
    expect(resolved).toBeInstanceOf(LimitExceededError);
  });
  xit('should return already exists error when grpc status is ALREADY_EXISTS', () => {
    const serviceError = generateServiceError(Status.ALREADY_EXISTS);
    cacheServiceErrorMapper.resolveOrRejectError({
      err: serviceError,
      errorResponseFactoryFn: errorResponseFactoryFn,
      resolveFn: resolveFn,
      rejectFn: rejectFn,
    });
    expect(resolved).toBeInstanceOf(CacheAlreadyExistsError);
  });

  describe('when throwOnErrors is true', () => {
    const mapperWithThrowOnErrors = new CacheServiceErrorMapper(true);

    it('should reject with LimitExceeded when grpc status is RESOURCE_EXHAUSTED', () => {
      const serviceError = generateServiceError(Status.RESOURCE_EXHAUSTED);
      mapperWithThrowOnErrors.resolveOrRejectError({
        err: serviceError,
        errorResponseFactoryFn: errorResponseFactoryFn,
        resolveFn: resolveFn,
        rejectFn: rejectFn,
      });
      expect(rejected).toBeInstanceOf(LimitExceededError);
    });
  });
});
