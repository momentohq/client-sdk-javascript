import {MomentoLogger} from '../../';
import {
  DetermineWhenToResubscribeProps,
  SubscriptionRetryEligibilityStrategy,
  SubscriptionRetryStrategy,
} from '@gomomento/sdk-core';
import {TopicSubscriptionRetryEligibilityStrategy} from './topic-subscription-retry-eligibility-strategy';

export interface TopicSubscriptionRetryStrategyProps {
  logger: MomentoLogger;

  // Determine whether to resubscribe after an error
  eligibilityStrategy?: SubscriptionRetryEligibilityStrategy;

  // Retry subscription after a fixed time interval (defaults to 500ms)
  retryDelayMillis?: number;
}

export class TopicSubscriptionRetryStrategy
  implements SubscriptionRetryStrategy
{
  private readonly logger: MomentoLogger;
  readonly eligibilityStrategy: SubscriptionRetryEligibilityStrategy;
  readonly retryDelayMillis: number;

  constructor(props: TopicSubscriptionRetryStrategyProps) {
    this.logger = props.logger;
    this.eligibilityStrategy =
      props.eligibilityStrategy ??
      new TopicSubscriptionRetryEligibilityStrategy(props.logger);
    this.retryDelayMillis = props.retryDelayMillis ?? 500;
  }

  determineWhenToResubscribe(
    props: DetermineWhenToResubscribeProps
  ): number | null {
    this.logger.debug(
      `Determining whether request is eligible for resubscribe; error: ${props.sdkError.errorCode()} ${
        props.sdkError.message
      }`
    );
    if (!this.eligibilityStrategy.isEligibleForResubscribe(props)) {
      // null means do not retry
      return null;
    }
    this.logger.debug(
      `Request is eligible for retry, retrying after ${this.retryDelayMillis}ms.`
    );
    return this.retryDelayMillis;
  }
}
