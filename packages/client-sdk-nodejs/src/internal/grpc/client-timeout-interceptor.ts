import {MomentoLogger, MomentoLoggerFactory} from '@gomomento/sdk-core';
import {InterceptingCall, Interceptor, status} from '@grpc/grpc-js';
import {RetryStrategy} from '../../config/retry/retry-strategy';
import {FixedTimeoutRetryStrategy} from '../../config/retry/fixed-timeout-retry-strategy';
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
    retryStrategy instanceof FixedTimeoutRetryStrategy
  ) {
    const responseDataReceivedTimeoutMs =
      retryStrategy.getResponseDataReceivedTimeoutMillis();
    return new RetryUntilTimeoutInterceptor(
      loggerFactory ?? new DefaultMomentoLoggerFactory(),
      overallRequestTimeoutMs,
      responseDataReceivedTimeoutMs
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
      // Replace default timeout with the desired overall timeout
      // on the first time through and set the first incremental timeout
      if (this.overallDeadline === undefined) {
        const newDate = new Date(Date.now());
        newDate.setMilliseconds(
          newDate.getMilliseconds() + this.overallRequestTimeoutMs
        );
        this.overallDeadline = newDate;

        const deadline = new Date(Date.now());
        deadline.setMilliseconds(
          deadline.getMilliseconds() + this.responseDataReceivedTimeoutMs
        );
        options.deadline = deadline;
        this.logger.debug(`new deadline set to ${options.deadline.valueOf()}`);
        return new InterceptingCall(nextCall(options));
      }

      // If the received deadline is equal to the overall deadline, we've
      // maxed out the retries and should cancel the request.
      const receivedDeadline = options.deadline;
      if (
        receivedDeadline === undefined ||
        receivedDeadline === this.overallDeadline
      ) {
        this.logger.debug(
          'Unable to successfully retry request within overall timeout, canceling request'
        );
        // reset overall deadline for next request
        this.overallDeadline = undefined;
        const call = new InterceptingCall(nextCall(options));
        call.cancelWithStatus(
          status.CANCELLED,
          'Unable to successfully retry request within overall timeout'
        );
        return call;
      }

      // Otherwise, we've hit an incremental timeout and must set the next deadline.
      const newDeadline = new Date(Date.now());
      newDeadline.setMilliseconds(
        newDeadline.getMilliseconds() + this.responseDataReceivedTimeoutMs
      );
      if (newDeadline > this.overallDeadline) {
        this.logger.debug(
          `new deadline would exceed overall deadline, setting to overall deadline ${this.overallDeadline.valueOf()}`
        );
        options.deadline = this.overallDeadline;
      } else {
        this.logger.debug(`new deadline set to ${newDeadline.valueOf()}`);
        options.deadline = newDeadline;
      }

      return new InterceptingCall(nextCall(options));
    };
  }
}
