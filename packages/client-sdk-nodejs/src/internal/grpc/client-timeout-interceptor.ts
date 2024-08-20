import {MomentoLogger, MomentoLoggerFactory} from '@gomomento/sdk-core';
import {InterceptingCall, Interceptor, status} from '@grpc/grpc-js';
import {RetryStrategy} from '../../config/retry/retry-strategy';
import {DefaultStorageRetryStrategy} from '../../config/retry/storage-default-retry-strategy';
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
    retryStrategy instanceof DefaultStorageRetryStrategy
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

export class BasicTimeoutInterceptor {
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

export class RetryUntilTimeoutInterceptor {
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

      const receivedDeadline = options.deadline?.valueOf() || 0;
      this.logger.debug(
        `intercepting call with options.deadline ${receivedDeadline}`
      );

      // Reset incremental deadline only if it has been reached
      if (receivedDeadline < Date.now()) {
        this.logger.debug('received deadline < current time, resetting');

        const deadline = new Date(Date.now());
        deadline.setMilliseconds(
          deadline.getMilliseconds() + this.responseDataReceivedTimeoutMs
        );

        if (deadline.valueOf() > this.overallDeadline.valueOf()) {
          this.logger.debug(
            'Unable to successfully retry request within client timeout, canceling request'
          );
          const call = new InterceptingCall(nextCall(options));
          call.cancelWithStatus(
            status.CANCELLED,
            'Unable to successfully retry request within client timeout'
          );
          return call;
        } else {
          options.deadline = deadline;
          this.logger.debug(
            `new deadline set to ${options.deadline.valueOf()}`
          );
        }
      }

      return new InterceptingCall(nextCall(options));
    };
  }
}
