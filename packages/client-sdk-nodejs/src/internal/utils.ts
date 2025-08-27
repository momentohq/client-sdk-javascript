import {MomentoLogger} from '@gomomento/sdk-core';
import {Interceptor} from '@grpc/grpc-js';
import {CancellationInterceptor} from './grpc/cancellation-interceptor';

export function convert(v: string | Uint8Array): Uint8Array {
  if (typeof v === 'string') {
    return new TextEncoder().encode(v);
  }
  return v;
}

export function getCurrentTimeAsDateObject(): Date {
  return new Date();
}

export function createDateObjectFromUnixMillisTimestamp(
  unixMillisTimestamp: number
): Date {
  return new Date(unixMillisTimestamp);
}

export function hasExceededDeadlineRelativeToNow(overallDeadline: Date) {
  return getCurrentTimeAsDateObject() >= overallDeadline;
}

/**
 * Helper method to handle AbortSignal cancellation for gRPC calls.
 * This centralizes the cancellation logic and ensures consistent behavior.
 * @param abortSignal - The AbortSignal to monitor
 * @param grpcCall - The gRPC call to cancel
 * @param operationName - Name of the operation for logging
 */
export function setupAbortSignalHandler(
  logger: MomentoLogger,
  abortSignal: AbortSignal | undefined,
  grpcCall: {cancel: () => void},
  operationName: string
): void {
  if (abortSignal !== undefined) {
    if (abortSignal.aborted) {
      grpcCall.cancel();
    } else {
      abortSignal.addEventListener('abort', () => {
        logger.debug(`Abort signal received, cancelling ${operationName} call`);
        grpcCall.cancel();
      });
    }
  }
}

/**
 * Helper method to create interceptors with AbortSignal cancellation support.
 * @param abortSignal - The AbortSignal to monitor
 * @returns Array of interceptors including cancellation if abortSignal is provided
 */
export function createInterceptorsWithCancellation(
  interceptors: Interceptor[],
  abortSignal?: AbortSignal
): Interceptor[] {
  return [
    ...interceptors,
    CancellationInterceptor.createCancellationInterceptor(abortSignal),
  ];
}
