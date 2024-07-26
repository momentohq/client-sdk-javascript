import {MomentoLogger, MomentoLoggerFactory} from '@gomomento/sdk-core';
import {InterceptingCall, Interceptor, status} from '@grpc/grpc-js';

export function createStorageClientTimeoutInterceptor(
  loggerFactory: MomentoLoggerFactory,
  overallRequestTimeoutMs: number,
  responseDataReceivedTimeoutMs: number
): Array<Interceptor> {
  return [
    new StorageClientTimeoutInterceptor(
      loggerFactory,
      overallRequestTimeoutMs,
      responseDataReceivedTimeoutMs
    ).createTimeoutInterceptor(),
  ];
}

export class StorageClientTimeoutInterceptor {
  private readonly logger: MomentoLogger;
  private readonly responseDataReceivedTimeoutMs: number;
  private readonly overallDeadline: number;

  constructor(
    loggerFactory: MomentoLoggerFactory,
    overallRequestTimeoutMs: number,
    responseDataReceivedTimeoutMs: number
  ) {
    this.logger = loggerFactory.getLogger(this);
    this.responseDataReceivedTimeoutMs = responseDataReceivedTimeoutMs;
    const newDate = new Date(Date.now());
    this.overallDeadline = newDate.setMilliseconds(
      newDate.getMilliseconds() + overallRequestTimeoutMs
    );
    this.logger.debug(
      `creating interceptor, overall deadline: ${this.overallDeadline}`
    );
  }

  public createTimeoutInterceptor(): Interceptor {
    return (options, nextCall) => {
      this.logger.debug(
        `intercepting call with options.deadline ${
          options.deadline?.valueOf() || 'undefined'
        }`
      );

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
        this.logger.debug(`new deadline set to ${options.deadline.valueOf()}`);
      }

      return new InterceptingCall(nextCall(options));
    };
  }
}
