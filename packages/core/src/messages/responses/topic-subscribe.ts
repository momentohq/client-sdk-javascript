import {SdkError} from '../../errors';
import {BaseResponseError, BaseResponseSubscription} from './response-base';
import {SubscriptionState} from '../../internal/subscription-state';
import {TopicSubscribeResponse} from './enums';
import {MomentoLogger, MomentoLoggerFactory} from '../../config/logging';

interface IResponse {
  readonly type: TopicSubscribeResponse;
}

/**
 * Encapsulates a topic subscription.
 *
 * @remarks Currently allows unsubscribing from the topic.
 * In the future, this may be extended to include additional
 * statistics about the subscription.
 */
export class Subscription
  extends BaseResponseSubscription
  implements IResponse
{
  private subscriptionState: SubscriptionState;
  private readonly logger: MomentoLogger;
  readonly type: TopicSubscribeResponse.Subscription =
    TopicSubscribeResponse.Subscription;

  constructor(
    loggerFactory: MomentoLoggerFactory,
    subscriptionState: SubscriptionState
  ) {
    super();
    this.logger = loggerFactory.getLogger(this);
    this.subscriptionState = subscriptionState;
  }

  /**
   * Unsubscribes from the topic.
   *
   * @returns void
   */
  public unsubscribe(): void {
    this.logger.trace(
      `Unsubscribing from subscription: ${this.subscriptionState.toString()}`
    );
    this.subscriptionState.unsubscribe();
  }

  public get isSubscribed(): boolean {
    return this.subscriptionState.isSubscribed;
  }
}

/**
 * Indicates that an error occurred during the topic subscribe request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: TopicSubscribeResponse.Error = TopicSubscribeResponse.Error;
  constructor(_innerException: SdkError) {
    super(_innerException);
  }
}

export type Response = Subscription | Error;
