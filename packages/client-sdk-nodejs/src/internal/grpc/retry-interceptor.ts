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
import {
  createDateObjectFromUnixMillisTimestamp,
  getCurrentTimeAsDateObject,
  hasExceededDeadlineRelativeToNow,
} from '../utils';

export interface RetryInterceptorProps {
  clientName: string;
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
    const logger = props.loggerFactory.getLogger(RetryInterceptor.name);

    const retryStrategy: RetryStrategy =
      props.retryStrategy ??
      new NoRetryStrategy({loggerFactory: props.loggerFactory});

    const overallRequestTimeoutMs = props.overallRequestTimeoutMs;
    const deadlineOffset =
      retryStrategy.responseDataReceivedTimeoutMillis ??
      props.overallRequestTimeoutMs;

    logger.trace(
      `Creating RetryInterceptor (for ${
        props.clientName
      }); overall request timeout offset: ${overallRequestTimeoutMs} ms; retry strategy responseDataRecievedTimeoutMillis: ${String(
        retryStrategy?.responseDataReceivedTimeoutMillis
      )}; deadline offset: ${deadlineOffset} ms`
    );

    // The interceptor is a function that takes (options, nextCall) and
    // returns InterceptingCall(nextCall(options), requester).
    // The requester object acts on outgoing requests, and we define `start`
    // and `sendMessage` methods on it below.
    // Within the requester object, you can define a listener object that acts on incoming responses.
    // The listener object has `onReceiveMessage` and `onReceiveStatus` methods defined below.
    // Reference: https://github.com/grpc/grpc-node/tree/master/examples/interceptors
    return (options, nextCall) => {
      logger.trace(
        `Entering RetryInterceptor (for ${
          props.clientName
        }); overall request timeout offset: ${overallRequestTimeoutMs} ms; deadline offset: ${String(
          deadlineOffset
        )}`
      );

      // The first attempt at a request should use the overall request timeout,
      // not a retry strategy-specific timeout (i.e. responseDataReceivedTimeoutMillis).
      const overallDeadline = calculateDeadline(overallRequestTimeoutMs);
      options.deadline = overallDeadline;
      logger.trace(
        `Setting initial deadline (for ${
          props.clientName
        }): ${overallDeadline.toISOString()}`
      );

      let savedMetadata: Metadata;
      let savedSendMessage: unknown;
      let savedReceiveMessage: unknown;
      let savedMessageNext: (arg0: unknown) => void;

      return new InterceptingCall(nextCall(options), {
        start: function (metadata, listener, next) {
          savedMetadata = metadata;

          // The listener object acts on incoming responses.
          // Our retry logic is implemented in the `onReceiveStatus` method.
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

              // This is the retry function that is called when a request is eligible for retry.
              const retry = function (message: unknown, metadata: Metadata) {
                logger.debug(
                  `Retrying request: path: ${
                    options.method_definition.path
                  }; deadline was: ${String(
                    (options.deadline as Date | undefined)?.toISOString()
                  )}, overall deadline is: ${overallDeadline.toISOString()}`
                );
                // Note: we need to manually check if overall deadline has been exceeded
                // because the retry interceptor does not return a status code of DEADLINE_EXCEEDED
                // when a retry attempt is made with an already-passed deadline.
                //
                // We also need this check in case DEADLINE_EXCEEDED is marked as a retryable status code
                // as it is in the default storage eligibility strategy.
                if (hasExceededDeadlineRelativeToNow(overallDeadline)) {
                  logger.debug(
                    `Request not eligible for retry: path: ${
                      options.method_definition.path
                    }; overall deadline exceeded: ${overallDeadline.toISOString()}`
                  );
                  savedMessageNext(savedReceiveMessage);
                  status.code = Status.DEADLINE_EXCEEDED;
                  next(status);
                  return;
                }
                // Do not exceed the overall deadline when setting the retry attempt's deadline.
                const nextDeadline = calculateDeadline(
                  deadlineOffset,
                  overallDeadline
                );
                logger.debug(
                  `Setting retry attempt deadline (via offset of ${deadlineOffset} ms) to: ${nextDeadline.toISOString()}`
                );
                options.deadline = nextDeadline;

                // Here, we kind of define an interceptor within the retry interceptor.
                // The `newCall.start` accepts a new listener that's sent out with the retried request.
                // All retries will use this logic to recursively call the retry function if needed.
                // Retry attempts' responses are handled in the `onReceiveStatus` method defined on newCall's listener.
                const newCall = nextCall(options);
                newCall.start(metadata, {
                  onReceiveMessage: function (message) {
                    savedReceiveMessage = message;
                  },
                  onReceiveStatus: function (status) {
                    logger.trace(
                      `Inner retry loop received status ${status.code}, determining when to retry`
                    );
                    const whenToRetry =
                      retryStrategy.determineWhenToRetryRequest({
                        grpcStatus: status,
                        grpcRequest: options.method_definition,
                        attemptNumber: attempts,
                        requestMetadata: metadata,
                        overallDeadline: overallDeadline,
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

              // From the first incoming response, we determine if the request is eligible for retry.
              // If it is not, we call the next function.
              // If it is, we call the `retry` function defined above.
              // We only execute this code once, when the first response is received, to kick off
              // the retry loop defined by the `retry` function.
              if (status.code === Status.OK) {
                savedMessageNext(savedReceiveMessage);
                next(status);
              } else {
                const whenToRetry = retryStrategy.determineWhenToRetryRequest({
                  grpcStatus: status,
                  grpcRequest: options.method_definition,
                  attemptNumber: attempts,
                  requestMetadata: metadata,
                  overallDeadline: overallDeadline,
                });
                if (whenToRetry === null) {
                  logger.debug(
                    `Request not eligible for retry: path: ${options.method_definition.path}; response status code: ${status.code}.`
                  );
                  savedMessageNext(savedReceiveMessage);
                  next(status);
                } else {
                  logger.trace(
                    'First response not OK, entering inner retry loop'
                  );
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

          // The requester object ends with a call to `next()` and passes
          // along the listener object we defined above.
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

function calculateDeadline(offsetMillis: number, maxDeadline?: Date): Date {
  const deadline = createDateObjectFromUnixMillisTimestamp(
    getCurrentTimeAsDateObject().getTime() + offsetMillis
  );
  if (maxDeadline !== undefined && deadline >= maxDeadline) {
    return maxDeadline;
  }
  return deadline;
}
