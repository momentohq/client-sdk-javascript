import {
  DeterminewhenToRetryRequestProps,
  RetryStrategy,
} from './retry-strategy';
import {EligibilityStrategy} from './eligibility-strategy';
import {
  MomentoLoggerFactory,
  MomentoLogger,
  DefaultMomentoLoggerFactory,
} from '../../';
import {DefaultStorageEligibilityStrategy} from './storage-default-eligibility-strategy';

export interface DefaultStorageRetryStrategyProps {
  loggerFactory: MomentoLoggerFactory;
  eligibilityStrategy?: EligibilityStrategy;

  // Retry request after a fixed time interval (defaults to 100ms)
  retryDelayIntervalMillis?: number;

  // Number of milliseconds the client is willing to wait for response data to be received before retrying (defaults to 1000ms). After the overarching GRPC config deadlineMillis has been reached, the client will terminate the RPC with a Cancelled error.
  responseDataReceivedTimeoutMillis?: number;
}

export class DefaultStorageRetryStrategy implements RetryStrategy {
  private readonly logger: MomentoLogger;
  private readonly eligibilityStrategy: EligibilityStrategy;
  private readonly retryDelayIntervalMillis: number;
  private readonly responseDataReceivedTimeoutMillis: number;

  constructor(props: DefaultStorageRetryStrategyProps) {
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
      `Request is eligible for retry (attempt ${props.attemptNumber}), retrying soon.`
    );
    // retry after a fixed time interval has passed
    return this.retryDelayIntervalMillis;
  }

  public getResponseDataReceivedTimeoutMillis(): number {
    return this.responseDataReceivedTimeoutMillis;
  }
}

export class DefaultStorageRetryStrategyFactory {
  static getRetryStrategy(
    props?: DefaultStorageRetryStrategyProps
  ): DefaultStorageRetryStrategy {
    return new DefaultStorageRetryStrategy({
      loggerFactory: props?.loggerFactory ?? new DefaultMomentoLoggerFactory(),
      eligibilityStrategy: props?.eligibilityStrategy,
      retryDelayIntervalMillis: props?.retryDelayIntervalMillis,
      responseDataReceivedTimeoutMillis:
        props?.responseDataReceivedTimeoutMillis,
    });
  }
}
