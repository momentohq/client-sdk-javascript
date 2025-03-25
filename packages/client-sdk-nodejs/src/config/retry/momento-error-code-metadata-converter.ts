import {MomentoErrorCode} from '@gomomento/sdk-core';

class MomentoErrorCodeMetadataConverter {
  private static readonly momentoErrorCodeToMetadataMap: Record<
    string,
    string
  > = {
    [MomentoErrorCode.INVALID_ARGUMENT_ERROR]: 'invalid-argument',
    [MomentoErrorCode.UNKNOWN_SERVICE_ERROR]: 'unknown',
    [MomentoErrorCode.CACHE_ALREADY_EXISTS_ERROR]: 'already-exists',
    [MomentoErrorCode.ALREADY_EXISTS_ERROR]: 'already-exists',
    [MomentoErrorCode.STORE_ALREADY_EXISTS_ERROR]: 'already-exists',
    [MomentoErrorCode.CACHE_NOT_FOUND_ERROR]: 'not-found',
    [MomentoErrorCode.NOT_FOUND_ERROR]: 'not-found',
    [MomentoErrorCode.STORE_NOT_FOUND_ERROR]: 'not-found',
    [MomentoErrorCode.STORE_ITEM_NOT_FOUND_ERROR]: 'not-found',
    [MomentoErrorCode.INTERNAL_SERVER_ERROR]: 'internal',
    [MomentoErrorCode.PERMISSION_ERROR]: 'permission-denied',
    [MomentoErrorCode.AUTHENTICATION_ERROR]: 'unauthenticated',
    [MomentoErrorCode.CANCELLED_ERROR]: 'cancelled',
    [MomentoErrorCode.CONNECTION_ERROR]: 'unavailable',
    [MomentoErrorCode.LIMIT_EXCEEDED_ERROR]: 'resource-exhausted',
    [MomentoErrorCode.BAD_REQUEST_ERROR]: 'invalid-argument',
    [MomentoErrorCode.TIMEOUT_ERROR]: 'deadline-exceeded',
    [MomentoErrorCode.SERVER_UNAVAILABLE]: 'unavailable',
    [MomentoErrorCode.CLIENT_RESOURCE_EXHAUSTED]: 'resource-exhausted',
    [MomentoErrorCode.FAILED_PRECONDITION_ERROR]: 'failed-precondition',
    [MomentoErrorCode.UNKNOWN_ERROR]: 'unknown',
  };

  /**
   * Converts a MomentoErrorCode enum value to its corresponding metadata type.
   * @param errorCode - The error code to convert.
   * @returns The corresponding metadata type.
   */
  public static convert(errorCode: string): string {
    const metadataType = this.momentoErrorCodeToMetadataMap[errorCode];
    if (!metadataType) {
      throw new Error(`Unsupported MomentoErrorCode: ${errorCode}`);
    }
    return metadataType;
  }
}

export {MomentoErrorCodeMetadataConverter};
