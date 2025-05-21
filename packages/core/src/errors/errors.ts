export enum MomentoErrorCode {
  // Invalid argument passed to Momento client
  INVALID_ARGUMENT_ERROR = 'INVALID_ARGUMENT_ERROR',
  // Service returned an unknown response
  UNKNOWN_SERVICE_ERROR = 'UNKNOWN_SERVICE_ERROR',
  // Cache with specified name already exists
  CACHE_ALREADY_EXISTS_ERROR = 'ALREADY_EXISTS_ERROR',
  /** @deprecated use CACHE_ALREADY_EXISTS_ERROR instead */
  ALREADY_EXISTS_ERROR = 'ALREADY_EXISTS_ERROR',
  // Store with specified name already exists
  STORE_ALREADY_EXISTS_ERROR = 'ALREADY_EXISTS_ERROR',
  // Cache with specified name doesn't exist
  CACHE_NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  /** @deprecated use CACHE_NOT_FOUND_ERROR instead */
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  // Store with specified name doesn't exist
  STORE_NOT_FOUND_ERROR = 'STORE_NOT_FOUND_ERROR',
  // Item with specified key doesn't exist
  STORE_ITEM_NOT_FOUND_ERROR = 'STORE_ITEM_NOT_FOUND_ERROR',
  // An unexpected error occurred while trying to fulfill the request
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  // Insufficient permissions to perform operation
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  // Invalid authentication credentials to connect to cache service
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  // Request was cancelled by the server
  CANCELLED_ERROR = 'CANCELLED_ERROR',
  // Error connecting to Momento servers
  CONNECTION_ERROR = 'CONNECTION_ERROR',
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
  protected readonly _transportDetails: MomentoErrorTransportDetails;
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
export class CacheAlreadyExistsError extends SdkError {
  override _errorCode = MomentoErrorCode.CACHE_ALREADY_EXISTS_ERROR;
  override _messageWrapper =
    'A cache with the specified name already exists.  To resolve this error, either delete the existing cache and make a new one, or use a different name';
}

/**
 * Error that occurs when trying to create a store with the same name as an existing cache. To resolve this error,
 * either delete the existing store and make a new one, or change the name of the store you are trying to create to
 * one that doesn't already exist
 */
export class StoreAlreadyExistsError extends SdkError {
  override _errorCode = MomentoErrorCode.STORE_ALREADY_EXISTS_ERROR;
  override _messageWrapper =
    'A store with the specified name already exists.  To resolve this error, either delete the existing store and make a new one, or use a different name';
}

/**
 * Error when authentication with Cache Service fails
 */
export class AuthenticationError extends SdkError {
  override _errorCode = MomentoErrorCode.AUTHENTICATION_ERROR;
  override _messageWrapper =
    'Invalid authentication credentials to connect to cache service';
}

/**
 * Error raised in response to an invalid request
 */
export class BadRequestError extends SdkError {
  override _errorCode = MomentoErrorCode.BAD_REQUEST_ERROR;
  override _messageWrapper =
    'The request was invalid; please contact us at support@momentohq.com';
}

/**
 * Error when an operation with Cache Service was cancelled
 */
export class CancelledError extends SdkError {
  override _errorCode = MomentoErrorCode.CANCELLED_ERROR;
  override _messageWrapper =
    'The request was cancelled; please contact us if this was unexpected at support@momentohq.com';
}

/**
 * Error when there's a failure to connect to Momento servers.
 */
export class ConnectionError extends SdkError {
  override _errorCode = MomentoErrorCode.CONNECTION_ERROR;
}

/**
 * Error raised when system in not in a state required for the operation's success
 */
export class FailedPreconditionError extends SdkError {
  override _errorCode = MomentoErrorCode.FAILED_PRECONDITION_ERROR;
  override _messageWrapper =
    "System is not in a state required for the operation's execution";
}

/**
 * Cache Service encountered an unexpected exception while trying to fulfill the request
 */
export class InternalServerError extends SdkError {
  override _errorCode = MomentoErrorCode.INTERNAL_SERVER_ERROR;
  override _messageWrapper =
    'An unexpected error occurred while trying to fulfill the request; please contact us at support@momentohq.com';
}

/**
 * Represents errors thrown when invalid parameters are passed to the Momento Cache
 */
export class InvalidArgumentError extends SdkError {
  override _errorCode = MomentoErrorCode.INVALID_ARGUMENT_ERROR;
  override _messageWrapper = 'Invalid argument passed to Momento client';
}

enum LimitExceededMessageWrapper {
  TOPIC_SUBSCRIPTIONS_LIMIT_EXCEEDED = 'Topic subscriptions limit exceeded for this account',
  OPERATIONS_RATE_LIMIT_EXCEEDED = 'Request rate limit exceeded for this account',
  THROUGHPUT_RATE_LIMIT_EXCEEDED = 'Bandwidth limit exceeded for this account',
  REQUEST_SIZE_LIMIT_EXCEEDED = 'Request size limit exceeded for this account',
  ITEM_SIZE_LIMIT_EXCEEDED = 'Item size limit exceeded for this account',
  ELEMENT_SIZE_LIMIT_EXCEEDED = 'Element size limit exceeded for this account',
  UNKNOWN_LIMIT_EXCEEDED = 'Limit exceeded for this account',
}

/**
 * Error when calls are throttled due to request limit rate
 */
export class LimitExceededError extends SdkError {
  override _errorCode = MomentoErrorCode.LIMIT_EXCEEDED_ERROR;
  override _messageWrapper = this.determineMessageWrapper();
  private errCause: string | undefined;

  constructor(
    message: string,
    code = 0,
    metadata: object | undefined = undefined,
    stack: string | undefined = undefined,
    errCause?: string
  ) {
    super(message, code, metadata, stack);
    this.errCause = errCause;
  }

  private determineMessageWrapper() {
    // If provided, we use the `err` metadata value to determine the most
    // appropriate error message to return.
    if (this.errCause !== undefined) {
      switch (this.errCause) {
        case 'topic_subscriptions_limit_exceeded':
          return LimitExceededMessageWrapper.TOPIC_SUBSCRIPTIONS_LIMIT_EXCEEDED;
        case 'operations_rate_limit_exceeded':
          return LimitExceededMessageWrapper.OPERATIONS_RATE_LIMIT_EXCEEDED;
        case 'throughput_rate_limit_exceeded':
          return LimitExceededMessageWrapper.THROUGHPUT_RATE_LIMIT_EXCEEDED;
        case 'request_size_limit_exceeded':
          return LimitExceededMessageWrapper.REQUEST_SIZE_LIMIT_EXCEEDED;
        case 'item_size_limit_exceeded':
          return LimitExceededMessageWrapper.ITEM_SIZE_LIMIT_EXCEEDED;
        case 'element_size_limit_exceeded':
          return LimitExceededMessageWrapper.ELEMENT_SIZE_LIMIT_EXCEEDED;
        default:
          return LimitExceededMessageWrapper.UNKNOWN_LIMIT_EXCEEDED;
      }
    }

    // If `err` metadata is unavailable, try to use the error details field
    // to return the an appropriate error message.
    if (this._transportDetails.grpc.details !== undefined) {
      const details = this._transportDetails.grpc.details.toLowerCase();
      if (details.includes('subscribers')) {
        return LimitExceededMessageWrapper.TOPIC_SUBSCRIPTIONS_LIMIT_EXCEEDED;
      } else if (details.includes('operations')) {
        return LimitExceededMessageWrapper.OPERATIONS_RATE_LIMIT_EXCEEDED;
      } else if (details.includes('throughput')) {
        return LimitExceededMessageWrapper.THROUGHPUT_RATE_LIMIT_EXCEEDED;
      } else if (details.includes('request limit')) {
        return LimitExceededMessageWrapper.REQUEST_SIZE_LIMIT_EXCEEDED;
      } else if (details.includes('item size')) {
        return LimitExceededMessageWrapper.ITEM_SIZE_LIMIT_EXCEEDED;
      } else if (details.includes('element size')) {
        return LimitExceededMessageWrapper.ELEMENT_SIZE_LIMIT_EXCEEDED;
      }
    }

    // If all else fails, return a generic "limit exceeded" message
    return LimitExceededMessageWrapper.UNKNOWN_LIMIT_EXCEEDED;
  }
}

/**
 * Error that occurs when trying to get a cache that doesn't exist. To resolve, make sure that the cache you are trying
 * to get exists. If it doesn't create it first and then try again
 */
export class CacheNotFoundError extends SdkError {
  override _errorCode = MomentoErrorCode.CACHE_NOT_FOUND_ERROR;
  override _messageWrapper =
    'A cache with the specified name does not exist.  To resolve this error, make sure you have created the cache before attempting to use it';
}

/**
 * Error that occurs when trying to get a store that doesn't exist. To resolve, make sure that the store you are trying
 * to get exists. If it doesn't create it first and then try again.
 */
export class StoreNotFoundError extends SdkError {
  override _errorCode = MomentoErrorCode.STORE_NOT_FOUND_ERROR;
  override _messageWrapper =
    'A store with the specified name does not exist.  To resolve this error, make sure you have created the store before attempting to use it';
}

/**
 * Error that occurs when trying to get an item from store that doesn't exist. To resolve, make sure that the item you are trying
 * to get exists. If it doesn't create it first and then try again.
 */
export class StoreItemNotFoundError extends SdkError {
  override _errorCode = MomentoErrorCode.STORE_ITEM_NOT_FOUND_ERROR;
  override _messageWrapper = 'An item with the specified key does not exist';
}

/**
 * Insufficient permissions to perform an operation on Cache Service
 */
export class PermissionError extends SdkError {
  override _errorCode = MomentoErrorCode.PERMISSION_ERROR;
  override _messageWrapper =
    'Insufficient permissions to perform an operation on a cache';
}

/**
 * Server was unable to handle the request.
 */
export class ServerUnavailableError extends SdkError {
  override _errorCode = MomentoErrorCode.SERVER_UNAVAILABLE;
  override _messageWrapper =
    'The server was unable to handle the request; consider retrying.  If the error persists, please contact us at support@momentohq.com';
}

/**
 * Error when an operation did not complete in time
 */
export class TimeoutError extends SdkError {
  override _errorCode = MomentoErrorCode.TIMEOUT_ERROR;
  override _messageWrapper =
    "The client's configured timeout was exceeded; you may need to use a Configuration with more lenient timeouts";
}

/**
 * Error raised when the underlying cause in unknown
 */
export class UnknownError extends SdkError {
  override _errorCode = MomentoErrorCode.UNKNOWN_ERROR;
  override _messageWrapper = 'Unknown error has occurred';
}

/**
 * Error raised when the service returns an unknown response
 */
export class UnknownServiceError extends SdkError {
  override _errorCode = MomentoErrorCode.UNKNOWN_SERVICE_ERROR;
  override _messageWrapper =
    'Service returned an unknown response; please contact us at support@momentohq.com';
}

/**
 * Error raised when a client resource is exhausted, such as memory or number of subscriptions (stream connections).
 */
export class ClientResourceExhaustedError extends SdkError {
  override _errorCode = MomentoErrorCode.CLIENT_RESOURCE_EXHAUSTED;

  constructor(message: string | undefined = undefined) {
    super(
      message ??
        'A client resource is exhausted, such as memory or number of subscriptions (stream connections).'
    );
  }
}
