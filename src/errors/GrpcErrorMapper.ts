import {ClientSdkError} from "./ClientSdkError";
import {Status} from "@grpc/grpc-js/build/src/constants";
import {PermissionDeniedError} from "./PermissionDeniedError";
import {CacheNotFoundError} from "./CacheNotFoundError";
import {IllegalArgumentError} from "./IllegalArgumentError";
import {InternalServerError} from "./InternalServerError";
import {ServiceError} from "@grpc/grpc-js";

export function errorMapper(err: ServiceError): ClientSdkError {
    if (err.code === Status.PERMISSION_DENIED) {
        return new PermissionDeniedError(err.message)
    }
    if (err.code === Status.NOT_FOUND) {
        return new CacheNotFoundError(err.message)
    }
    if (err.code === Status.INVALID_ARGUMENT) {
        return new IllegalArgumentError(err.message)
    }
    return new InternalServerError("unable to process request")
}