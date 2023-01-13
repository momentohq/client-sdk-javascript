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
  // Request rate, bandwidth, or object size exceeded the limits for the account
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
  public readonly metadata?: object;
  constructor(code: number, details: string, metadata?: object) {
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
  protected readonly _errorCode: MomentoErrorCode;
  protected readonly _messageWrapper: string;
  private readonly _transportDetails: MomentoErrorTransportDetails;
  private readonly _stack: string | undefined;
  constructor(
    message: string,
    code = 0,
    metadata: object | undefined = undefined,
    stack: string | undefined = undefined
  ) {
    super(message);
    const grpcDetails = new MomentoGrpcErrorDetails(code, message, metadata);
    this._transportDetails = new MomentoErrorTransportDetails(grpcDetails);
    this.stack = stack ?? undefined;
  }

  public wrappedErrorMessage(): string {
    return `${this._messageWrapper}: ${this.message}`;
  }

  public errorCode() {
    return this._errorCode;
  }

  public transportDetails() {
    return this._transportDetails;
  }
}

/**
 * Error that occurs when trying to create a cache with the same name as an existing cache. To resolve this error,
 * either delete the existing cache and make a new one, or change the name of the cache you are trying to create to
 * one that doesn't already exist
 */
export class AlreadyExistsError extends SdkError {
  _errorCode = MomentoErrorCode.ALREADY_EXISTS_ERROR;
  _messageWrapper =
    'A cache with the specified name already exists.  To resolve this error, either delete the existing cache and make a new one, or use a different name';
}

/**
 * Error when authentication with Cache Service fails
 */
export class AuthenticationError extends SdkError {
  _errorCode = MomentoErrorCode.AUTHENTICATION_ERROR;
  _messageWrapper =
    'Invalid authentication credentials to connect to cache service';
}

/**
 * Error raised in response to an invalid request
 */
export class BadRequestError extends SdkError {
  _errorCode = MomentoErrorCode.BAD_REQUEST_ERROR;
  _messageWrapper =
    'The request was invalid; please contact us at support@momentohq.com';
}

/**
 * Error when an operation with Cache Service was cancelled
 */
export class CancelledError extends SdkError {
  _errorCode = MomentoErrorCode.CANCELLED_ERROR;
  _messageWrapper =
    'The request was cancelled by the server; please contact us at support@momentohq.com';
}

/**
 * Error raised when system in not in a state required for the operation's success
 */
export class FailedPreconditionError extends SdkError {
  _errorCode = MomentoErrorCode.FAILED_PRECONDITION_ERROR;
  _messageWrapper =
    "System is not in a state required for the operation's execution";
}

/**
 * Cache Service encountered an unexpected exception while trying to fulfill the request
 */
export class InternalServerError extends SdkError {
  _errorCode = MomentoErrorCode.INTERNAL_SERVER_ERROR;
  _messageWrapper =
    'An unexpected error occurred while trying to fulfill the request; please contact us at support@momentohq.com';
}

/**
 * Represents errors thrown when invalid parameters are passed to the Momento Cache
 */
export class InvalidArgumentError extends SdkError {
  _errorCode = MomentoErrorCode.INVALID_ARGUMENT_ERROR;
  _messageWrapper = 'Invalid argument passed to Momento client';
}

/**
 * Error when calls are throttled due to request limit rate
 */
export class LimitExceededError extends SdkError {
  _errorCode = MomentoErrorCode.LIMIT_EXCEEDED_ERROR;
  _messageWrapper =
    'Request rate, bandwidth, or object size exceeded the limits for this account.  To resolve this error, reduce your usage as appropriate or contact us at support@momentohq.com to request a limit increase';
}

/**
 * Error that occurs when trying to get a cache that doesn't exist. To resolve, make sure that the cache you are trying
 * to get exists. If it doesn't create it first and then try again
 */
export class NotFoundError extends SdkError {
  _errorCode = MomentoErrorCode.NOT_FOUND_ERROR;
  _messageWrapper =
    'A cache with the specified name does not exist.  To resolve this error, make sure you have created the cache before attempting to use it';
}

/**
 * Insufficient permissions to perform an operation on Cache Service
 */
export class PermissionError extends SdkError {
  _errorCode = MomentoErrorCode.PERMISSION_ERROR;
  _messageWrapper =
    'Insufficient permissions to perform an operation on a cache';
}

/**
 * Server was unable to handle the request.
 */
export class ServerUnavailableError extends SdkError {
  _errorCode = MomentoErrorCode.SERVER_UNAVAILABLE;
  _messageWrapper =
    'The server was unable to handle the request; consider retrying.  If the error persists, please contact us at support@momentohq.com';
}

/**
 * Error when an operation did not complete in time
 */
export class TimeoutError extends SdkError {
  _errorCode = MomentoErrorCode.TIMEOUT_ERROR;
  _messageWrapper =
    "The client's configured timeout was exceeded; you may need to use a Configuration with more lenient timeouts";
}

/**
 * Error raised when the underlying cause in unknown
 */
export class UnknownError extends SdkError {
  _errorCode = MomentoErrorCode.UNKNOWN_ERROR;
  _messageWrapper = 'Unknown error has occurred';
}

/**
 * Error raised when the service returns an unknown response
 */
export class UnknownServiceError extends SdkError {
  _errorCode = MomentoErrorCode.UNKNOWN_SERVICE_ERROR;
  _messageWrapper =
    'Service returned an unknown response; please contact us at support@momentohq.com';
}
