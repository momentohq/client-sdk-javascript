import {
  ListWebhooks,
  PutWebhook,
  DeleteWebhook,
  Webhook,
  WebhookId,
  GetWebhookSecret,
  RotateWebhookSecret,
} from '../../../index';

export interface IWebhookClient {
  listWebhooks(cache: string): Promise<ListWebhooks.Response>;
  putWebhook(webhook: Webhook): Promise<PutWebhook.Response>;
  deleteWebhook(id: WebhookId): Promise<DeleteWebhook.Response>;
  getWebhookSecret(id: WebhookId): Promise<GetWebhookSecret.Response>;
  rotateWebhookSecret(id: WebhookId): Promise<RotateWebhookSecret.Response>;
}
