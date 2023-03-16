import {PubsubClient} from './internal/pubsub-client';
import {TopicPublish, MomentoLogger} from '.';
import {range} from './internal/utils/collections';
import {TopicClientProps} from './topic-client-props';
import {SubscribeCallOptions} from './utils/topic-call-options';

/**
 * Momento Topic Client.
 *
 * Publish and subscribe to topics.
 */
export class TopicClient {
  private readonly logger: MomentoLogger;
  private readonly pubsubClients: Array<PubsubClient>;
  private nextPubsubClientIndex: number;

  /**
   * Creates an instance of TopicClient.
   */
  constructor(props: TopicClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.logger.info('Creating Momento CacheClient');

    const numClients = 1;
    this.pubsubClients = range(numClients).map(() => new PubsubClient(props));
    // We round-robin the requests through all of our clients.  Since javascript
    // is single-threaded, we don't have to worry about thread safety on this
    // index variable.
    this.nextPubsubClientIndex = 0;
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
    const client = this.getNextPubsubClient();
    return await client.publish(cacheName, topicName, value);
  }

  public async subscribe(
    cacheName: string,
    topicName: string,
    options: SubscribeCallOptions
  ): Promise<void> {
    const client = this.getNextPubsubClient();
    return await client.subscribe(cacheName, topicName, options);
  }

  private getNextPubsubClient(): PubsubClient {
    const client = this.pubsubClients[this.nextPubsubClientIndex];
    this.nextPubsubClientIndex =
      (this.nextPubsubClientIndex + 1) % this.pubsubClients.length;
    return client;
  }
}
