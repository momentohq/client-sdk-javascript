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
  Status.INTERNAL,
  Status.UNAVAILABLE,
];

export interface RetryInterceptorOptions {
  loggerOptions?: LoggerOptions;
}

export class RetryInterceptor {
  private readonly logger: Logger;

  constructor(options?: RetryInterceptorOptions) {
    this.logger = getLogger(this.constructor.name, options?.loggerOptions);
  }

  public addRetryInterceptor(): Interceptor {
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
                          `Retryable status code: ${status.code}; number of retries (${retries}) is less than max (${maxRetry}), retrying.`
                        );
                        retry(message, metadata);
                      } else {
                        logger.debug(
                          `Retryable status code: ${status.code}; number of retries (${retries}) has exceeded max (${maxRetry}), not retrying.`
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
                  `Response status code: ${status.code}; eligible for retry.`
                );
                retry(savedSendMessage, savedMetadata);
              } else {
                logger.debug(
                  `Response status code: ${status.code}; not eligible for retry.`
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
