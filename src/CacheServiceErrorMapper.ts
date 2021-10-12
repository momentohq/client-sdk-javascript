import {Status} from "@grpc/grpc-js/build/src/constants";
import {ServiceError} from "@grpc/grpc-js";
import {
    CacheServiceError,
    InternalServerError,
    InvalidArgumentError,
    PermissionDeniedError
} from './Errors';

export function cacheServiceErrorMapper(err: ServiceError): CacheServiceError {
    if (err.code === Status.PERMISSION_DENIED) {
        return new PermissionDeniedError(err.message);
    }
    if (err.code === Status.INVALID_ARGUMENT) {
        return new InvalidArgumentError(err.message)
    }
    return new InternalServerError("unable to process request")
}