import {
  TopicPublish,
  TopicSubscribe,
  SubscribeCallOptions,
  ListWebhooks,
  PutWebhook,
  DeleteWebhook,
  WebhookId,
  Webhook,
  GetWebhookSecret,
} from '../index';

export interface ITopicClient {
  publish(
    cacheName: string,
    topicName: string,
    value: string | Uint8Array
  ): Promise<TopicPublish.Response>;

  subscribe(
    cacheName: string,
    topicName: string,
    options: SubscribeCallOptions
  ): Promise<TopicSubscribe.Response>;

  listWebhooks(cache: string): Promise<ListWebhooks.Response>;
  putWebhook(webhook: Webhook): Promise<PutWebhook.Response>;
  deleteWebhook(id: WebhookId): Promise<DeleteWebhook.Response>;
  getWebhookSecret(id: WebhookId): Promise<GetWebhookSecret.Response>;
}
