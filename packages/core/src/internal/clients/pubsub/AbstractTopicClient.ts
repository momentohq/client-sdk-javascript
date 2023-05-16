import {ITopicClient} from './ITopicClient';
import {
  MomentoLogger,
  SubscribeCallOptions,
  TopicPublish,
  TopicSubscribe,
} from '../../../index';
import {IPubsubClient} from './IPubsubClient';

export abstract class AbstractTopicClient implements ITopicClient {
  protected readonly logger: MomentoLogger;
  protected readonly client: IPubsubClient;

  /**
   * Publishes a value to a topic.
   *
   * @param {string} cacheName - The name of the cache to containing the topic to publish to.
   * @param {string} topicName - The name of the topic to publish to.
   * @param {string | Uint8Array} value - The value to publish.
   * @returns {Promise<TopicPublish.Response>} -
   * {@link TopicPublish.Success} on success.
   * {@link TopicPublish.Error} on failure.
   */
  public async publish(
    cacheName: string,
    topicName: string,
    value: string | Uint8Array
  ): Promise<TopicPublish.Response> {
    return await this.client.publish(cacheName, topicName, value);
  }

  /**
   * Subscribes to a topic.
   *
   * @param {string} cacheName - The name of the cache to containing the topic to subscribe to.
   * @param {string} topicName - The name of the topic to subscribe to.
   * @param {SubscribeCallOptions} options - The options for the subscription. Defaults to no-op handlers.
   * @param {function} options.onItem - The callback to invoke when data is received. Defaults to no-op.
   * @param {function} options.onError - The callback to invoke when an error is received. Defaults to no-op.
   * @returns {Promise<TopicSubscribe.Response>} -
   * {@link TopicSubscribe.Subscription} on success.
   * {@link TopicSubscribe.Error} on failure.
   */
  public async subscribe(
    cacheName: string,
    topicName: string,
    options: SubscribeCallOptions
  ): Promise<TopicSubscribe.Response> {
    return await this.client.subscribe(cacheName, topicName, options);
  }
}
