import {WebhookDestination} from '..';

/**
 * Options for the put webhook call
 */
export interface PutWebhookCallOptions {
  /**
   * The destination of the webhook which will be invoked
   */
  destination: WebhookDestination | string;

  /**
   * The name of the topic for the webhook to listen too
   */
  topicName: string;
}
