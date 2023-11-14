import {AbstractTopicClient} from '@gomomento/sdk-core/dist/src/internal/clients/pubsub/AbstractTopicClient';
import {MomentoLogger} from '.';
import {PubsubClient} from './internal/pubsub-client';
import {TopicClientProps} from './topic-client-props';
import {IPubsubClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {IWebhookClient} from '../../core/src/internal/clients/pubsub/IWebhookClient';
import {WebhookClient} from './internal/webhook-client';

/**
 * Momento Topic Client.
 *
 * Publish and subscribe to topics.
 */
export class TopicClient extends AbstractTopicClient {
  protected readonly logger: MomentoLogger;
  protected readonly pubsubClient: IPubsubClient;
  protected readonly webhookClient: IWebhookClient;

  /**
   * Creates an instance of TopicClient.
   */
  constructor(props: TopicClientProps) {
    super();
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.logger.debug('Creating Momento TopicClient');

    this.pubsubClient = new PubsubClient(props);
    this.webhookClient = new WebhookClient(props);
  }
}
