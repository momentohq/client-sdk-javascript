import {TopicSubscribe} from '..';

/**
 * Options for the subscribe call.
 */
export interface SubscribeCallOptions {
  /**
   * The callback to invoke when data is received from the topic subscription.
   *
   * @param data The data received from the topic subscription.
   */
  onItem(data: TopicSubscribe.Item): void;

  /**
   * The callback to invoke when an error is received from the topic subscription.
   *
   * @param error The error received from the topic subscription.
   * @param unsubscribeFn The function to invoke to unsubscribe from the topic subscription.
   */
  onError(error: TopicSubscribe.Error, unsubscribeFn: () => void): void;
}
