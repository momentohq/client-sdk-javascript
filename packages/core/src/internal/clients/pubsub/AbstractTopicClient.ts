import {ITopicClient} from '../../../clients/ITopicClient';
import {
  MomentoLogger,
  SubscribeCallOptions,
  TopicPublish,
  TopicSubscribe,
  ListWebhooks,
  PutWebhook,
  DeleteWebhook,
  WebhookId,
  Webhook,
} from '../../../index';
import {IPubsubClient} from './IPubsubClient';
import {IWebhookClient} from './IWebhookClient';

export abstract class AbstractTopicClient implements ITopicClient {
  protected readonly logger: MomentoLogger;
  protected readonly pubsubClient: IPubsubClient;
  protected readonly webhookClient: IWebhookClient;

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
    return await this.pubsubClient.publish(cacheName, topicName, value);
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
    return await this.pubsubClient.subscribe(cacheName, topicName, options);
  }

  /**
   * Deletes a webhook
   *
   * @param {WebhookId} id - The webhook id to be deleted
   * @returns {Promise<DeleteWebhook.Response>} -
   * {@link DeleteWebhook.Success} on success.
   * {@link DeleteWebhook.Error} on failure.
   */
  public async deleteWebhook(id: WebhookId): Promise<DeleteWebhook.Response> {
    return await this.webhookClient.deleteWebhook(id);
  }

  /**
   * Lists webhooks associated with a cache
   *
   * @param {string} cache - The cache to list webhooks associated with it
   * @returns {Promise<ListWebhooks.Response>} -
   * {@link ListWebhooks.Success} on success.
   * {@link ListWebhooks.Error} on failure.
   */
  public async listWebhooks(cache: string): Promise<ListWebhooks.Response> {
    return await this.webhookClient.listWebhooks(cache);
  }

  /**
   * Creates a new webhook, or updates an existing one
   *
   * @param {Webhook} webhook - The webhook to create/update
   * @returns {Promise<PutWebhook.Response>} -
   * {@link PutWebhook.Success} on success.
   * {@link PutWebhook.Error} on failure.
   */
  public async putWebhook(webhook: Webhook): Promise<PutWebhook.Response> {
    return await this.webhookClient.putWebhook(webhook);
  }
}
