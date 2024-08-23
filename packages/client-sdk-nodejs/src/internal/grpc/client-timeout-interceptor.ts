import {MomentoLogger, MomentoLoggerFactory} from '@gomomento/sdk-core';
import {InterceptingCall, Interceptor, status} from '@grpc/grpc-js';
import {RetryStrategy} from '../../config/retry/retry-strategy';
import {DefaultMomentoLoggerFactory} from '../../config/logging/default-momento-logger';

// Determine which retry strategy is specified in the configuration
// and which interceptor to use.
export const ClientTimeoutInterceptor = (
  overallRequestTimeoutMs: number,
  retryStrategy?: RetryStrategy,
  loggerFactory?: MomentoLoggerFactory
): Interceptor => {
  if (
    retryStrategy !== undefined &&
    retryStrategy.responseDataReceivedTimeoutMillis !== undefined
  ) {
    return new RetryUntilTimeoutInterceptor(
      loggerFactory ?? new DefaultMomentoLoggerFactory(),
      overallRequestTimeoutMs,
      retryStrategy.responseDataReceivedTimeoutMillis
    ).createTimeoutInterceptor();
  }
  return new BasicTimeoutInterceptor(
    overallRequestTimeoutMs
  ).createTimeoutInterceptor();
};

class BasicTimeoutInterceptor {
  private readonly overallRequestTimeoutMs: number;

  constructor(overallRequestTimeoutMs: number) {
    this.overallRequestTimeoutMs = overallRequestTimeoutMs;
  }

  public createTimeoutInterceptor(): Interceptor {
    return (options, nextCall) => {
      if (!options.deadline) {
        const deadline = new Date(Date.now());
        deadline.setMilliseconds(
          deadline.getMilliseconds() + this.overallRequestTimeoutMs
        );
        options.deadline = deadline;
      }
      return new InterceptingCall(nextCall(options));
    };
  }
}

class RetryUntilTimeoutInterceptor {
  private readonly logger: MomentoLogger;
  private readonly responseDataReceivedTimeoutMs: number;
  private readonly overallRequestTimeoutMs: number;
  private overallDeadline?: Date;
  private previousRpc?: string;

  constructor(
    loggerFactory: MomentoLoggerFactory,
    overallRequestTimeoutMs: number,
    responseDataReceivedTimeoutMs: number
  ) {
    this.logger = loggerFactory.getLogger(this);
    this.responseDataReceivedTimeoutMs = responseDataReceivedTimeoutMs;
    this.overallRequestTimeoutMs = overallRequestTimeoutMs;
  }

  public createTimeoutInterceptor(): Interceptor {
    return (options, nextCall) => {
      this.logger.debug(
        `Previous RPC: ${this.previousRpc ?? 'none'} | Incoming RPC: ${
          options.method_definition.path
        }`
      );

      // If the received deadline is equal to the overall deadline, we've
      // maxed out the retries on a particular request and should cancel retries.
      const receivedDeadline = options.deadline;
      if (
        receivedDeadline !== undefined &&
        receivedDeadline === this.overallDeadline
      ) {
        this.logger.debug(
          `Unable to successfully retry request within overall timeout of ${this.overallRequestTimeoutMs}ms, canceling request`
        );
        // reset overall deadline for next request
        this.overallDeadline = undefined;
        this.previousRpc = undefined;
        const call = new InterceptingCall(nextCall(options));
        call.cancelWithStatus(
          status.CANCELLED,
          `Unable to successfully retry request within overall timeout of ${this.overallRequestTimeoutMs}ms`
        );
        return call;
      }

      // Reset overall and incremental deadlines in these cases:
      // Case 1: overallDeadline is undefined (first request or previous was canceled)
      // Case 2: different RPC path requested through same client
      // Case 3: new request through same client after original retry deadline has passed
      // (Note: Case 3 check must occur after the receivedDeadline == options.deadline check
      // or else the request is always retried).
      if (
        this.overallDeadline === undefined ||
        this.previousRpc !== options.method_definition.path ||
        (this.overallDeadline !== undefined &&
          Date.now().valueOf() > this.overallDeadline.valueOf())
      ) {
        this.previousRpc = options.method_definition.path;
        this.overallDeadline = createNewDeadline(this.overallRequestTimeoutMs);
        options.deadline = createNewDeadline(
          this.responseDataReceivedTimeoutMs
        );
        this.logger.debug(
          `Overall deadline set to ${this.overallDeadline.valueOf()}, which is ${
            this.overallRequestTimeoutMs
          }ms from now`
        );
        this.logger.debug(
          `Incremental deadline set to ${options.deadline.valueOf()}, which is ${
            this.responseDataReceivedTimeoutMs
          }ms from now`
        );
        return new InterceptingCall(nextCall(options));
      }

      // Otherwise, we've hit an incremental timeout and must set the next deadline.
      const newDeadline = createNewDeadline(this.responseDataReceivedTimeoutMs);
      if (newDeadline > this.overallDeadline) {
        this.logger.debug(
          `New incremental deadline ${newDeadline.valueOf()} would exceed overall deadline, setting to overall deadline ${this.overallDeadline.valueOf()}`
        );
        options.deadline = this.overallDeadline;
      } else {
        this.logger.debug(
          `Incremental deadline set to ${newDeadline.valueOf()}, which is ${
            this.responseDataReceivedTimeoutMs
          }ms from now`
        );
        options.deadline = newDeadline;
      }
      this.previousRpc = options.method_definition.path;

      return new InterceptingCall(nextCall(options));
    };
  }
}

function createNewDeadline(timeToAddMillis: number): Date {
  const deadline = new Date(Date.now());
  deadline.setMilliseconds(deadline.getMilliseconds() + timeToAddMillis);
  return deadline;
}
