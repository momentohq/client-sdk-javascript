import {
  DeterminewhenToRetryRequestProps,
  RetryStrategy,
} from './retry-strategy';
import {EligibilityStrategy} from './eligibility-strategy';
import {MomentoLoggerFactory, MomentoLogger} from '../..';
import {DefaultStorageEligibilityStrategy} from './storage-default-eligibility-strategy';

export interface FixedTimeoutRetryStrategyProps {
  loggerFactory: MomentoLoggerFactory;
  eligibilityStrategy?: EligibilityStrategy;

  // Retry request after a fixed time interval (defaults to 100ms)
  retryDelayIntervalMillis?: number;

  // Number of milliseconds the client is willing to wait for response data to be received before retrying (defaults to 1000ms). After the overarching GRPC config deadlineMillis has been reached, the client will terminate the RPC with a Cancelled error.
  responseDataReceivedTimeoutMillis?: number;
}

export class FixedTimeoutRetryStrategy implements RetryStrategy {
  private readonly logger: MomentoLogger;
  private readonly eligibilityStrategy: EligibilityStrategy;
  private readonly retryDelayIntervalMillis: number;
  readonly responseDataReceivedTimeoutMillis: number;

  constructor(props: FixedTimeoutRetryStrategyProps) {
    this.logger = props.loggerFactory.getLogger(this);
    this.eligibilityStrategy =
      props.eligibilityStrategy ??
      new DefaultStorageEligibilityStrategy(props.loggerFactory);
    this.retryDelayIntervalMillis = props.retryDelayIntervalMillis ?? 100;
    this.responseDataReceivedTimeoutMillis =
      props.responseDataReceivedTimeoutMillis ?? 1000;
  }

  determineWhenToRetryRequest(
    props: DeterminewhenToRetryRequestProps
  ): number | null {
    this.logger.debug(
      `Determining whether request is eligible for retry; status code: ${props.grpcStatus.code}, request type: ${props.grpcRequest.path}, attemptNumber: ${props.attemptNumber}`
    );
    if (!this.eligibilityStrategy.isEligibleForRetry(props)) {
      // null means do not retry
      return null;
    }

    this.logger.debug(
      `Request is eligible for retry (attempt ${props.attemptNumber}), retrying after ${this.retryDelayIntervalMillis} +/- some jitter.`
    );
    // retry after a fixed time interval has passed (+/- some jitter)
    return addJitter(this.retryDelayIntervalMillis);
  }
}

function addJitter(whenToRetry: number): number {
  return (0.2 * Math.random() + 0.9) * whenToRetry;
}
