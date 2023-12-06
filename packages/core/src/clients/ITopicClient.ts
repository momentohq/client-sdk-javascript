import {
  TopicPublish,
  TopicSubscribe,
  SubscribeCallOptions,
  ListWebhooks,
  PutWebhook,
  DeleteWebhook,
  GetWebhookSecret,
  RotateWebhookSecret,
} from '../index';
import {PutWebhookCallOptions} from '../utils/webhook-call-options';

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
  putWebhook(
    cacheName: string,
    webhookName: string,
    options: PutWebhookCallOptions
  ): Promise<PutWebhook.Response>;
  deleteWebhook(
    cacheName: string,
    webhookName: string
  ): Promise<DeleteWebhook.Response>;
  getWebhookSecret(
    cacheName: string,
    webhookName: string
  ): Promise<GetWebhookSecret.Response>;
  rotateWebhookSecret(
    cacheName: string,
    webhookName: string
  ): Promise<RotateWebhookSecret.Response>;
}
