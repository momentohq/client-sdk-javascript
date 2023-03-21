import {TopicSubscribe} from '..';

/**
 * Options for the subscribe call.
 */
export interface SubscribeCallOptions {
  /**
   * The callback to invoke when data is received from the topic subscription.
   *
   * @param item The data received from the topic subscription.
   */
  onItem?: (item: TopicSubscribe.Item) => void;

  /**
   * The callback to invoke when an error is received from the topic subscription.
   *
   * @param error The error received from the topic subscription.
   * @param subscription The subscription that received the error.
   */
  onError?: (
    error: TopicSubscribe.Error,
    subscription: TopicSubscribe.Subscription
  ) => void;
}
