import {WebhookDestination} from '../utils';

export interface WebhookId {
  cacheName: string;
  webhookName: string;
}

export interface Webhook {
  destination: WebhookDestination;
  id: WebhookId;
  topicName: string;
}

export interface WebhookItem {
  webhook: Webhook;
  secret: string;
}
