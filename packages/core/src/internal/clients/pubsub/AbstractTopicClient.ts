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

export abstract class AbstractTopicClient implements ITopicClient {
  protected readonly logger: MomentoLogger;
  protected readonly pubsubClients: IPubsubClient[];
  protected readonly webhookClient: IWebhookClient;
  private nextPubsubClientIndex = 0;

  protected constructor(
    logger: MomentoLogger,
    pubsubClients: IPubsubClient[],
    webhookClient: IWebhookClient
  ) {
    this.logger = logger;
    this.pubsubClients = pubsubClients;
    this.webhookClient = webhookClient;
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
    return await this.getNextPubsubClient().publish(
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
    return await this.getNextPubsubClient().subscribe(
      cacheName,
      topicName,
      options
    );
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

  protected getNextPubsubClient(): IPubsubClient {
    const client = this.pubsubClients[this.nextPubsubClientIndex];
    this.nextPubsubClientIndex =
      (this.nextPubsubClientIndex + 1) % this.pubsubClients.length;
    return client;
  }
}
