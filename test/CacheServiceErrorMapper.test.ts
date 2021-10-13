import {Status} from '@grpc/grpc-js/build/src/constants';
import {cacheServiceErrorMapper} from '../src/CacheServiceErrorMapper';
import {Metadata, ServiceError} from '@grpc/grpc-js';
import {InternalServerError, PermissionDeniedError} from '../src/Errors';
import {ServiceValidationError} from '../src/Errors';

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
    expect(res).toBeInstanceOf(PermissionDeniedError);
  });
  it('should return invalid argument error when Status.INVALID_ARGUMENT', () => {
    const serviceError = generateServiceError(Status.INVALID_ARGUMENT);
    const res = cacheServiceErrorMapper(serviceError);
    expect(res).toBeInstanceOf(ServiceValidationError);
  });
  it('should return internal server error when Status is not INVALID_ARGUMENT or PERMISSION_DENIED', () => {
    const serviceError = generateServiceError(Status.NOT_FOUND);
    const res = cacheServiceErrorMapper(serviceError);
    expect(res).toBeInstanceOf(InternalServerError);
  });
});
