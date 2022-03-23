/**
 * Base class for all errors thrown by the sdk
 */
abstract class SdkError extends Error {
  protected constructor(message: string) {
    super(message);
  }
}

abstract class ClientSdkError extends SdkError {
  protected constructor(message: string) {
    super(message);
  }
}

/**
 * Represents errors thrown when invalid parameters are passed to the Momento Cache
 */
export class InvalidArgumentError extends ClientSdkError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidArgumentError';
  }
}

/**
 * Base class for all exceptions thrown by the Cache Service
 */
abstract class MomentoServiceError extends SdkError {
  protected constructor(message: string) {
    super(message);
  }
}

/**
 * Error occurs when an unexpected exception gets thrown from Cache Service
 */
export class UnknownServiceError extends MomentoServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'UnknownServiceError';
  }
}

/**
 * Base class for all exceptions resulting from Cache Service interactions
 */
export class CacheServiceError extends MomentoServiceError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Error that occurs when trying to create a cache with the same name as an existing cache. To resolve this error,
 * either delete the existing cache and make a new one, or change the name of the cache you are trying to create to
 * one that doesn't already exist
 */
export class AlreadyExistsError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'AlreadyExistsError';
  }
}

/**
 * Error that occurs when trying to get a cache that doesn't exist. To resolve, make sure that the cache you are trying
 * to get exists. If it doesn't create it first and then try again
 */
export class NotFoundError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Cache Service encountered an unexpected exception while trying to fulfill the request
 */
export class InternalServerError extends CacheServiceError {
  constructor(message: string, stack: string) {
    super(message);
    this.name = 'InternalServerError';
    this.stack = stack;
  }
}

/**
 * Insufficient permissions to perform an operation on Cache Service
 */
export class PermissionError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Error when authentication with Cache Service fails
 */
export class AuthenticationError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Error when an operation with Cache Service was cancelled
 */
export class CancelledError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'CancelledError';
  }
}

/**
 * Error when calls are throttled due to request limit rate
 */
export class LimitExceededError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'LimitExceededError';
  }
}

/**
 * Error raised when service validation fails for provided values
 */
export class BadRequestError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

/**
 * Error when an operation did not complete in time
 */
export class TimeoutError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class ServiceValidationError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceValidationError';
  }
}
