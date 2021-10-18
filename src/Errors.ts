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
 * Gets thrown when the jwt passed to the Momento client cannot have the claims parsed
 */
export class InvalidJwtError extends ClientSdkError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidJwtError';
  }
}

abstract class MomentoServiceError extends SdkError {
  protected constructor(message: string) {
    super(message);
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
export class CacheAlreadyExistsError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'CacheAlreadyExistsError';
  }
}

/**
 * Error that occurs when trying to get a cache that doesn't exist. To resolve, make sure that the cache you are trying
 * to get exists. If it doesn't create it first and then try again
 */
export class CacheNotFoundError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'CacheNotFoundError';
  }
}

/**
 * Cache Service encountered an unexpected exception while trying to fulfill the request
 */
export class InternalServerError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'InternalServerError';
  }
}

/**
 * Service rejected the request as the authentication credentials presented are invalid
 */
export class PermissionDeniedError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

export class ServiceValidationError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceValidationError';
  }
}
