import {MomentoLogger} from '../..';
import {
  EligibleForResubscribeProps,
  MomentoErrorCode,
  SubscriptionRetryEligibilityStrategy,
} from '@gomomento/sdk-core';

const nonRetryableSdkErrorCodes: Array<MomentoErrorCode> = [
  MomentoErrorCode.AUTHENTICATION_ERROR,
  MomentoErrorCode.CANCELLED_ERROR,
  MomentoErrorCode.CACHE_NOT_FOUND_ERROR,
  MomentoErrorCode.PERMISSION_ERROR,
  MomentoErrorCode.NOT_FOUND_ERROR,
];

export class TopicSubscriptionRetryEligibilityStrategy
  implements SubscriptionRetryEligibilityStrategy
{
  private readonly logger: MomentoLogger;

  constructor(logger: MomentoLogger) {
    this.logger = logger;
  }

  isEligibleForResubscribe(props: EligibleForResubscribeProps): boolean {
    if (nonRetryableSdkErrorCodes.includes(props.sdkError.errorCode())) {
      this.logger.debug(
        `Error code ${props.sdkError.errorCode()} is not retryable.`
      );
      return false;
    }

    return true;
  }
}
