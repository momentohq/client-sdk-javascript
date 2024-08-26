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
import {RetryStrategy} from '../../config/retry/retry-strategy';
import {Status} from '@grpc/grpc-js/build/src/constants';
import {MomentoLoggerFactory} from '../../';
import {NoRetryStrategy} from '../../config/retry/no-retry-strategy';

export interface RetryInterceptorProps {
  loggerFactory: MomentoLoggerFactory;
  overallRequestTimeoutMs: number;
  retryStrategy?: RetryStrategy;
}

export class RetryInterceptor {
  // TODO: We need to send retry count information to the server so that we
  // will have some visibility into how often this is happening to customers:
  // https://github.com/momentohq/client-sdk-nodejs/issues/80
  public static createRetryInterceptor(
    props: RetryInterceptorProps
  ): Interceptor {
    const logger = props.loggerFactory.getLogger(
      RetryInterceptor.constructor.name
    );

    const retryStrategy =
      props.retryStrategy ??
      new NoRetryStrategy({loggerFactory: props.loggerFactory});

    return (options, nextCall) => {
      console.log('THE MAIN RETRY INTERCEPTOR FN IS CALLED');
      if (!options.deadline) {
        const deadline = new Date(Date.now());
        deadline.setMilliseconds(
          deadline.getMilliseconds() + props.overallRequestTimeoutMs
        );
        options.deadline = deadline;
      }

      let savedMetadata: Metadata;
      let savedSendMessage: unknown;
      let savedReceiveMessage: unknown;
      let savedMessageNext: (arg0: unknown) => void;
      return new InterceptingCall(nextCall(options), {
        start: function (metadata, listener, next) {
          savedMetadata = metadata;
          const newListener: Listener = {
            onReceiveMessage: function (
              message: unknown,
              next: (arg0: unknown) => void
            ) {
              savedReceiveMessage = message;
              savedMessageNext = next;
            },
            onReceiveStatus: function (
              status: StatusObject,
              // NOTE: we have to use `any` here because that is what is used in the grpc-js type definitions
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              next: (arg0: any) => void
            ) {
              let attempts = 0;
              const originalDeadline = options.deadline;
              console.log(
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                `RETRY INTERCEPTOR: ORIGINAL DEADLINE: ${originalDeadline}`
              );
              const retry = function (message: unknown, metadata: Metadata) {
                console.log(
                  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                  `RECURSIVE RETRY; ORIGINAL DEADLINE: ${originalDeadline}, NEW DEADLINE: ${options.deadline}`
                );
                const newCall = nextCall(options);
                newCall.start(metadata, {
                  onReceiveMessage: function (message) {
                    savedReceiveMessage = message;
                  },
                  onReceiveStatus: function (status) {
                    const whenToRetry =
                      retryStrategy.determineWhenToRetryRequest({
                        grpcStatus: status,
                        grpcRequest: options.method_definition,
                        attemptNumber: attempts,
                        requestMetadata: metadata,
                      });

                    if (whenToRetry === null) {
                      logger.debug(
                        `Request not eligible for retry: path: ${options.method_definition.path}; retryable status code: ${status.code}; number of attempts (${attempts}).`
                      );
                      savedMessageNext(savedReceiveMessage);
                      next(status);
                    } else {
                      attempts++;
                      logger.debug(
                        `Request eligible for retry: path: ${options.method_definition.path}; response status code: ${status.code}; number of attempts (${attempts}); will retry in ${whenToRetry}ms`
                      );
                      setTimeout(() => retry(message, metadata), whenToRetry);
                    }
                  },
                });
                newCall.sendMessage(savedSendMessage);
                newCall.halfClose();
              };

              if (status.code === Status.OK) {
                savedMessageNext(savedReceiveMessage);
                next(status);
              } else {
                const whenToRetry = retryStrategy.determineWhenToRetryRequest({
                  grpcStatus: status,
                  grpcRequest: options.method_definition,
                  attemptNumber: attempts,
                  requestMetadata: metadata,
                });
                if (whenToRetry === null) {
                  logger.debug(
                    `Request not eligible for retry: path: ${options.method_definition.path}; response status code: ${status.code}.`
                  );
                  savedMessageNext(savedReceiveMessage);
                  next(status);
                } else {
                  attempts++;
                  logger.debug(
                    `Request eligible for retry: path: ${options.method_definition.path}; response status code: ${status.code}; number of attempts (${attempts}); will retry in ${whenToRetry}ms`
                  );
                  setTimeout(
                    () => retry(savedSendMessage, savedMetadata),
                    whenToRetry
                  );
                }
              }
            },
          };
          next(metadata, newListener);
        },
        sendMessage: function (message, next) {
          savedSendMessage = message;
          next(message);
        },
      });
    };
  }
}
