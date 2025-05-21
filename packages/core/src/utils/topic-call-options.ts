import {
  TopicItem,
  TopicSubscribe,
  TopicDiscontinuity,
  TopicHeartbeat,
} from '..';

/**
 * Options for the subscribe call.
 */
export interface SubscribeCallOptions {
  /**
   * The callback to invoke when data is received from the topic subscription.
   *
   * @param item The data received from the topic subscription.
   */
  onItem?: (item: TopicItem) => void;

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

  /**
   * The callback to invoke when a discontinuity is received from the topic subscription.
   *
   * @param discontinuity The discontinuity received from the topic subscription.
   */
  onDiscontinuity?: (discontinuity: TopicDiscontinuity) => void;

  /**
   * The callback to invoke when a heartbeat is received from the topic subscription.
   *
   * @param heartbeat The heartbeat received from the topic subscription.
   */
  onHeartbeat?: (heartbeat: TopicHeartbeat) => void;

  /**
   * The callback to invoke when the connection is lost.
   */
  onConnectionLost?: () => void;

  /**
   * The callback to invoke just before the subscription ends.
   */
  onSubscriptionEnd?: () => void;
}
