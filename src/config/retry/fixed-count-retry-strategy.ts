import {
  DeterminewhenToRetryRequestProps,
  RetryStrategy,
} from './retry-strategy';
import {EligibilityStrategy} from './eligibility-strategy';
import {DefaultEligibilityStrategy} from './default-eligibility-strategy';
import {MomentoLogger, MomentoLoggerFactory} from '../logging/momento-logger';

export interface FixedCountRetryStrategyProps {
  loggerFactory: MomentoLoggerFactory;
  maxAttempts: number;
  eligibilityStrategy?: EligibilityStrategy;
}

export class FixedCountRetryStrategy implements RetryStrategy {
  private readonly logger: MomentoLogger;
  private readonly eligibilityStrategy: EligibilityStrategy;
  private readonly maxAttempts: number;

  constructor(props: FixedCountRetryStrategyProps) {
    this.logger = props.loggerFactory.getLogger(this);
    this.eligibilityStrategy =
      props.eligibilityStrategy ??
      new DefaultEligibilityStrategy(props.loggerFactory);
    this.maxAttempts = props.maxAttempts;
  }

  determineWhenToRetryRequest(
    props: DeterminewhenToRetryRequestProps
  ): number | null {
    this.logger.debug(
      `Determining whether request is eligible for retry; status code: ${props.grpcStatus.code}, request type: ${props.grpcRequest.path}, attemptNumber: ${props.attemptNumber}, maxAttempts: ${this.maxAttempts}`
    );
    if (!this.eligibilityStrategy.isEligibleForRetry(props)) {
      // null means do not retry
      return null;
    }
    if (props.attemptNumber > this.maxAttempts) {
      this.logger.debug(`Exceeded max attempt count (${this.maxAttempts})`);
      // null means do not retry
      return null;
    }
    this.logger.debug(
      `Request is eligible for retry (attempt ${props.attemptNumber} of ${this.maxAttempts}, retrying immediately.`
    );
    // 0 means retry immediately
    return 0;
  }
}
