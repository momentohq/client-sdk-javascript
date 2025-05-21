import {ITopicClient} from '../../../clients/ITopicClient';
import {
  MomentoLogger,
  SubscribeCallOptions,
  TopicPublish,
  TopicSubscribe,
  ListWebhooks,
  PutWebhook,
  DeleteWebhook,
  GetWebhookSecret,
  PostUrlWebhookDestination,
  RotateWebhookSecret,
} from '../../../index';
import {IPubsubClient} from './IPubsubClient';
import {IWebhookClient} from './IWebhookClient';
import {PutWebhookCallOptions} from '../../../utils/webhook-call-options';
import {ClientResourceExhaustedError, SdkError} from '../../../errors';

class StreamClientWithCount {
  numActiveSubscriptions = 0;
  client: IPubsubClient;

  constructor(client: IPubsubClient) {
    this.client = client;
  }
}

export abstract class AbstractTopicClient implements ITopicClient {
  protected readonly logger: MomentoLogger;
  protected readonly pubsubClients: IPubsubClient[];
  protected readonly pubsubStreamClients: StreamClientWithCount[];
  protected readonly pubsubUnaryClients: IPubsubClient[];
  protected readonly webhookClient: IWebhookClient;
  private nextPubsubStreamClientIndex = 0;
  private nextPubsubUnaryClientIndex = 0;
  private readonly maxConcurrentSubscriptions;

  protected constructor(
    logger: MomentoLogger,
    pubsubStreamClients: IPubsubClient[],
    pubsubUnaryClients: IPubsubClient[],
    webhookClient: IWebhookClient
  ) {
    this.logger = logger;
    this.pubsubStreamClients = pubsubStreamClients.map(
      client => new StreamClientWithCount(client)
    );
    this.pubsubUnaryClients = pubsubUnaryClients;
    this.webhookClient = webhookClient;
    this.maxConcurrentSubscriptions = 100 * this.pubsubStreamClients.length;
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
    return await this.getNextPublishClient().publish(
      cacheName,
      topicName,
      value
    );
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
    try {
      const {client, decrementSubscriptionCount} =
        this.getNextSubscribeClient();
      const subscribeOptions = {
        ...options,
        onSubscriptionEnd: () => {
          // Call any existing onSubscriptionEnd handler
          options.onSubscriptionEnd?.();
          // Decrement the subscription count
          decrementSubscriptionCount();
        },
      };
      return await client.subscribe(cacheName, topicName, subscribeOptions);
    } catch (e) {
      return new TopicSubscribe.Error(e as SdkError);
    }
  }

  /**
   * Deletes a webhook
   *
   * @param {string} cacheName - The name of the cache associated with the webhook
   * @param {string} webhookName - The name of the webhook
   * @returns {Promise<DeleteWebhook.Response>} -
   * {@link DeleteWebhook.Success} on success.
   * {@link DeleteWebhook.Error} on failure.
   */
  public async deleteWebhook(
    cacheName: string,
    webhookName: string
  ): Promise<DeleteWebhook.Response> {
    return await this.webhookClient.deleteWebhook({cacheName, webhookName});
  }

  /**
   * Lists webhooks associated with a cache
   *
   * @param {string} cacheName - The cache to list webhooks associated with it
   * @returns {Promise<ListWebhooks.Response>} -
   * {@link ListWebhooks.Success} on success.
   * {@link ListWebhooks.Error} on failure.
   */
  public async listWebhooks(cacheName: string): Promise<ListWebhooks.Response> {
    return await this.webhookClient.listWebhooks(cacheName);
  }

  /**
   * Creates a new webhook, or updates an existing one
   *
   * @param {string} cacheName - The name of the cache to associate the webhook with
   * @param {string} webhookName - The name of the webhook
   * @param {PutWebhookCallOptions} options - The options for the webhook
   * @param {string} topicName - The name of the topic for the webhook to listen to
   * @param {WebhookDestination | string} webhookDestination - The url to associate the webhook with
   * @returns {Promise<PutWebhook.Response>} -
   * {@link PutWebhook.Success} on success.
   * {@link PutWebhook.Error} on failure.
   */
  public async putWebhook(
    cacheName: string,
    webhookName: string,
    options: PutWebhookCallOptions
  ): Promise<PutWebhook.Response> {
    let _dest = options.destination;
    if (typeof _dest === 'string') {
      _dest = new PostUrlWebhookDestination(_dest);
    }
    return await this.webhookClient.putWebhook({
      topicName: options.topicName,
      id: {
        cacheName,
        webhookName,
      },
      destination: _dest,
    });
  }

  /**
   * Gets the signing secret for a webhook
   *
   * @param {string} cacheName - The name of the cache associated with the webhook
   * @param {string} webhookName - The name of the webhook
   * @returns {Promise<GetWebhookSecret.Response>} -
   * {@link GetWebhookSecret.Success} on success.
   * {@link GetWebhookSecret.Error} on failure.
   */
  public async getWebhookSecret(
    cacheName: string,
    webhookName: string
  ): Promise<GetWebhookSecret.Response> {
    return await this.webhookClient.getWebhookSecret({cacheName, webhookName});
  }

  /**
   * Rotates the signing secret for a webhook
   *
   * @param {string} cacheName - The name of the cache associated with the webhook
   * @param {string} webhookName - The name of the webhook
   * @returns {Promise<RotateWebhookSecret.Response>} -
   * {@link RotateWebhookSecret.Success} on success.
   * {@link RotateWebhookSecret.Error} on failure.
   */
  public async rotateWebhookSecret(
    cacheName: string,
    webhookName: string
  ): Promise<RotateWebhookSecret.Response> {
    return await this.webhookClient.rotateWebhookSecret({
      cacheName,
      webhookName,
    });
  }

  protected getNextPublishClient(): IPubsubClient {
    const client = this.pubsubUnaryClients[this.nextPubsubUnaryClientIndex];
    this.nextPubsubUnaryClientIndex =
      (this.nextPubsubUnaryClientIndex + 1) % this.pubsubUnaryClients.length;
    return client;
  }

  protected getNextSubscribeClient(): {
    client: IPubsubClient;
    decrementSubscriptionCount: () => void;
  } {
    // Check if there's any client with capacity
    let totalActiveStreams = 0;
    for (const clientWithCount of this.pubsubStreamClients) {
      totalActiveStreams += clientWithCount.numActiveSubscriptions;
    }
    if (totalActiveStreams < this.maxConcurrentSubscriptions) {
      // Try to get a client with capacity for another subscription.
      // Allow up to maxConcurrentSubscriptions attempts.
      for (let i = 0; i < this.maxConcurrentSubscriptions; i++) {
        const clientWithCount =
          this.pubsubStreamClients[
            this.nextPubsubStreamClientIndex % this.pubsubStreamClients.length
          ];
        if (clientWithCount.numActiveSubscriptions < 100) {
          this.nextPubsubStreamClientIndex++;
          clientWithCount.numActiveSubscriptions++;
          return {
            client: clientWithCount.client,
            decrementSubscriptionCount: () => {
              clientWithCount.numActiveSubscriptions--;
            },
          };
        }
      }
    }

    throw new ClientResourceExhaustedError(
      'Already at maximum number of subscriptions'
    );
  }
}
