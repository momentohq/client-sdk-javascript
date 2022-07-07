// This is temporary work around defining our own interceptor to power re-try's
// Longer term with this proposal re-try's should be added to grpc core, and we
// can leverage by defining a retry policy.
// https://github.com/grpc/proposal/blob/master/A6-client-retries.md#grpc-retry-design
// For now we use re-try interceptor inspired by example here in interceptor proposal for nodejs grpc core
// https://github.com/grpc/proposal/blob/master/L5-node-client-interceptors.md#advanced-examples
// Main difference is that we maintain a allow list of retryable status codes vs trying all.
import {
  InterceptingCall,
  Interceptor,
  Listener,
  Metadata,
  StatusObject,
} from '@grpc/grpc-js';
import {Status} from '@grpc/grpc-js/build/src/constants';
import {getLogger, Logger, LoggerOptions} from '../utils/logging';

const maxRetry = 3;

const retryableGrpcStatusCodes: Array<Status> = [
  // including all the status codes for reference, but
  // commenting out the ones we don't want to retry on for now.

  // Status.OK,
  // Status.CANCELLED,
  // Status.UNKNOWN,
  // Status.INVALID_ARGUMENT,
  // Status.DEADLINE_EXCEEDED,
  // Status.NOT_FOUND,
  // Status.ALREADY_EXISTS,
  // Status.PERMISSION_DENIED,
  // Status.RESOURCE_EXHAUSTED,
  // Status.FAILED_PRECONDITION,
  // Status.ABORTED,
  // Status.OUT_OF_RANGE,
  // Status.UNIMPLEMENTED,
  Status.INTERNAL,
  Status.UNAVAILABLE,
  // Status.DATA_LOSS,
  // Status.UNAUTHENTICATED
];

export interface RetryInterceptorOptions {
  loggerOptions?: LoggerOptions;
}

// TODO: Retry interceptor behavior should be configurable, but we need to
// align on basic API design first: https://github.com/momentohq/client-sdk-javascript/issues/79 .
// For now, for convenience during development, you can toggle this hard-coded
// variable to enable/disable it.
const RETRIES_ENABLED = true;

export function createRetryInterceptorIfEnabled(
  options: RetryInterceptorOptions
): Array<Interceptor> {
  if (RETRIES_ENABLED) {
    return [new RetryInterceptor(options).createRetryInterceptor()];
  } else {
    return [];
  }
}

export class RetryInterceptor {
  private readonly logger: Logger;

  constructor(options?: RetryInterceptorOptions) {
    this.logger = getLogger(this, options?.loggerOptions);
  }

  // TODO: We need to send retry count information to the server so that we
  // will have some visibility into how often this is happening to customers:
  // https://github.com/momentohq/client-sdk-javascript/issues/80
  // TODO: we need to add backoff/jitter for the retries:
  // https://github.com/momentohq/client-sdk-javascript/issues/81
  public createRetryInterceptor(): Interceptor {
    const logger = this.logger;

    return (options, nextCall) => {
      let savedMetadata: Metadata;
      let savedSendMessage: any;
      let savedReceiveMessage: any;
      let savedMessageNext: (arg0: any) => void;
      return new InterceptingCall(nextCall(options), {
        start: function (metadata, listener, next) {
          savedMetadata = metadata;
          const newListener: Listener = {
            onReceiveMessage: function (
              message: any,
              next: (arg0: any) => void
            ) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              savedReceiveMessage = message;
              savedMessageNext = next;
            },
            onReceiveStatus: function (
              status: StatusObject,
              next: (arg0: any) => void
            ) {
              let retries = 0;
              const retry = function (message: any, metadata: Metadata) {
                retries++;
                const newCall = nextCall(options);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                newCall.start(metadata, {
                  onReceiveMessage: function (message) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    savedReceiveMessage = message;
                  },
                  onReceiveStatus: function (status) {
                    if (retryableGrpcStatusCodes.includes(status.code)) {
                      if (retries <= maxRetry) {
                        logger.debug(
                          `Request path: ${options.method_definition.path}; retryable status code: ${status.code}; number of retries (${retries}) is less than max (${maxRetry}), retrying.`
                        );
                        retry(message, metadata);
                      } else {
                        logger.debug(
                          `Request path: ${options.method_definition.path}; retryable status code: ${status.code}; number of retries (${retries}) has exceeded max (${maxRetry}), not retrying.`
                        );
                        savedMessageNext(savedReceiveMessage);
                        next(status);
                      }
                    } else {
                      savedMessageNext(savedReceiveMessage);
                      next({code: status.code});
                    }
                  },
                });
              };
              if (retryableGrpcStatusCodes.includes(status.code)) {
                logger.debug(
                  `Request path: ${options.method_definition.path}; response status code: ${status.code}; number of retries (${retries}) is less than max (${maxRetry}), retrying.`
                );
                retry(savedSendMessage, savedMetadata);
              } else {
                logger.trace(
                  `Request path: ${options.method_definition.path}; response status code: ${status.code}; not eligible for retry.`
                );
                savedMessageNext(savedReceiveMessage);
                next(status);
              }
            },
          };
          next(metadata, newListener);
        },
      });
    };
  }
}
