import {SdkError} from '../../errors';

export type EligibleForResubscribeProps = {
  sdkError: SdkError;
};

export interface SubscriptionRetryEligibilityStrategy {
  isEligibleForResubscribe(props: EligibleForResubscribeProps): boolean;
}
