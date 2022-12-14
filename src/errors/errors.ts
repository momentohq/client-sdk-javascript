export enum MomentoErrorCode {
  // Invalid argument passed to Momento client
  INVALID_ARGUMENT_ERROR = 'INVALID_ARGUMENT_ERROR',
  // Service returned an unknown response
  UNKNOWN_SERVICE_ERROR = 'UNKNOWN_SERVICE_ERROR',
  // Cache with specified name already exists
  ALREADY_EXISTS_ERROR = 'ALREADY_EXISTS_ERROR',
  // Cache with specified name doesn't exist
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  // An unexpected error occurred while trying to fulfill the request
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  // Insufficient permissions to perform operation
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  // Invalid authentication credentials to connect to cache service
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  // Request was cancelled by the server
  CANCELLED_ERROR = 'CANCELLED_ERROR',
  // Request rate exceeded the limits for the account
  LIMIT_EXCEEDED_ERROR = 'LIMIT_EXCEEDED_ERROR',
  // Request was invalid
  BAD_REQUEST_ERROR = 'BAD_REQUEST_ERROR',
  // Client's configured timeout was exceeded
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  // Server was unable to handle the request
  SERVER_UNAVAILABLE = 'SERVER_UNAVAILABLE',
  // A client resource (most likely memory) was exhausted
  CLIENT_RESOURCE_EXHAUSTED = 'CLIENT_RESOURCE_EXHAUSTED',
  // System is not in a state required for the operation's execution
  FAILED_PRECONDITION_ERROR = 'FAILED_PRECONDITION_ERROR',
  // Unknown error has occurred
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class MomentoGrpcErrorDetails {
  public readonly code: number;
  public readonly details: string;
  public readonly metadata: object | null;
  constructor(code: number, details: string, metadata: object | null) {
    this.code = code;
    this.details = details;
    this.metadata = metadata;
  }
}

export class MomentoErrorTransportDetails {
  public readonly grpc: MomentoGrpcErrorDetails;
  constructor(grpc: MomentoGrpcErrorDetails) {
    this.grpc = grpc;
  }
}
/**
 * Base class for all errors thrown by the sdk
 */
export abstract class SdkError extends Error {
  public readonly errorCode: MomentoErrorCode;
  public readonly message: string;
  public readonly transportDetails: MomentoErrorTransportDetails;
  public readonly stack: string | undefined;
  constructor(
    message: string,
    code = 0,
    metadata: object | null = null,
    stack: string | null = null
  ) {
    super(message);
    const grpcDetails = new MomentoGrpcErrorDetails(code, message, metadata);
    this.transportDetails = new MomentoErrorTransportDetails(grpcDetails);
    this.stack = stack ?? undefined;
  }
}

/**
 * Error that occurs when trying to create a cache with the same name as an existing cache. To resolve this error,
 * either delete the existing cache and make a new one, or change the name of the cache you are trying to create to
 * one that doesn't already exist
 */
export class AlreadyExistsError extends SdkError {
  errorCode = MomentoErrorCode.ALREADY_EXISTS_ERROR;
}

/**
 * Error when authentication with Cache Service fails
 */
export class AuthenticationError extends SdkError {
  errorCode = MomentoErrorCode.AUTHENTICATION_ERROR;
}

/**
 * Error raised in response to an invalid request
 */
export class BadRequestError extends SdkError {
  errorCode = MomentoErrorCode.BAD_REQUEST_ERROR;
}

/**
 * Error when an operation with Cache Service was cancelled
 */
export class CancelledError extends SdkError {
  errorCode = MomentoErrorCode.CANCELLED_ERROR;
}

/**
 * Error raised when system in not in a state required for the operation's success
 */
export class FailedPreconditionError extends SdkError {
  errorCode = MomentoErrorCode.FAILED_PRECONDITION_ERROR;
}

/**
 * Cache Service encountered an unexpected exception while trying to fulfill the request
 */
export class InternalServerError extends SdkError {
  errorCode = MomentoErrorCode.INTERNAL_SERVER_ERROR;
}

/**
 * Represents errors thrown when invalid parameters are passed to the Momento Cache
 */
export class InvalidArgumentError extends SdkError {
  errorCode = MomentoErrorCode.INVALID_ARGUMENT_ERROR;
}

/**
 * Error when calls are throttled due to request limit rate
 */
export class LimitExceededError extends SdkError {
  errorCode = MomentoErrorCode.LIMIT_EXCEEDED_ERROR;
}

/**
 * Error that occurs when trying to get a cache that doesn't exist. To resolve, make sure that the cache you are trying
 * to get exists. If it doesn't create it first and then try again
 */
export class NotFoundError extends SdkError {
  errorCode = MomentoErrorCode.NOT_FOUND_ERROR;
}

/**
 * Insufficient permissions to perform an operation on Cache Service
 */
export class PermissionError extends SdkError {
  errorCode = MomentoErrorCode.PERMISSION_ERROR;
}

/**
 * Server was unable to handle the request.
 */
export class ServerUnavailableError extends SdkError {
  errorCode = MomentoErrorCode.SERVER_UNAVAILABLE;
}

/**
 * Error when an operation did not complete in time
 */
export class TimeoutError extends SdkError {
  errorCode = MomentoErrorCode.TIMEOUT_ERROR;
}

/**
 * Error raised when the underlying cause in unknown
 */
export class UnknownError extends SdkError {
  errorCode = MomentoErrorCode.UNKNOWN_ERROR;
}

/**
 * Error raised when the service returns an unknown response
 */
export class UnknownServiceError extends SdkError {
  errorCode = MomentoErrorCode.UNKNOWN_SERVICE_ERROR;
}
