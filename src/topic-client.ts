import {PubsubClient} from './internal/pubsub-client';
import {TopicPublish, MomentoLogger} from '.';
import {TopicClientProps} from './topic-client-props';
import {SubscribeCallOptions} from './utils/topic-call-options';

/**
 * Momento Topic Client.
 *
 * Publish and subscribe to topics.
 */
export class TopicClient {
  private readonly logger: MomentoLogger;
  private readonly client: PubsubClient;

  /**
   * Creates an instance of TopicClient.
   */
  constructor(props: TopicClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.logger.info('Creating Momento CacheClient');

    this.client = new PubsubClient(props);
  }

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
   * @param {SubscribeCallOptions} options - The options for the subscription.
   * @param {function} options.dataListener - The callback to invoke when data is received.
   * @param {function} options.errorListener - The callback to invoke when an error is received.
   * @returns
   */
  public async subscribe(
    cacheName: string,
    topicName: string,
    options: SubscribeCallOptions
  ): Promise<void> {
    return await this.client.subscribe(cacheName, topicName, options);
  }
}
