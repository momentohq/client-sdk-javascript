import {SdkError} from '../../errors';
import {SubscriptionRetryEligibilityStrategy} from './subscription-retry-eligibility-strategy';

export const DEFAULT_SUBSCRIPTION_RETRY_DELAY_MILLIS = 500;

export interface DetermineWhenToResubscribeProps {
  sdkError: SdkError;
}

export interface SubscriptionRetryStrategy {
  // Determine whether to reconnect after an error
  eligibilityStrategy: SubscriptionRetryEligibilityStrategy;

  // Attempt to reconnect after a fixed time interval (defaults to 500ms)
  retryDelayMillis: number;

  determineWhenToResubscribe(
    props: DetermineWhenToResubscribeProps
  ): number | null;
}
