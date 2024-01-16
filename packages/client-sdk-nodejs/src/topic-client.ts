import {AbstractTopicClient} from '@gomomento/sdk-core/dist/src/internal/clients/pubsub/AbstractTopicClient';
import {MomentoLogger, TopicConfiguration, TopicConfigurations} from '.';
import {PubsubClient} from './internal/pubsub-client';
import {TopicClientProps} from './topic-client-props';
import {IPubsubClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {IWebhookClient} from '@gomomento/sdk-core/dist/src/internal/clients/pubsub/IWebhookClient';
import {WebhookClient} from './internal/webhook-client';
import {TopicClientPropsWithConfiguration} from './internal/topic-client-props-with-config';

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

    const configuration: TopicConfiguration =
      props.configuration ?? getDefaultTopicClientConfiguration();
    const propsWithConfiguration: TopicClientPropsWithConfiguration = {
      ...props,
      configuration,
    };

    this.logger = configuration.getLoggerFactory().getLogger(this);
    this.logger.debug('Creating Momento TopicClient');

    this.pubsubClient = new PubsubClient(propsWithConfiguration);
    this.webhookClient = new WebhookClient(propsWithConfiguration);
  }
}

function getDefaultTopicClientConfiguration(): TopicConfiguration {
  return TopicConfigurations.Default.latest();
}
