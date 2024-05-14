import {AbstractTopicClient} from '@gomomento/sdk-core/dist/src/internal/clients/pubsub/AbstractTopicClient';
import {TopicConfiguration, TopicConfigurations} from '.';
import {PubsubClient} from './internal/pubsub-client';
import {TopicClientProps} from './topic-client-props';
import {WebhookClient} from './internal/webhook-client';
import {TopicClientPropsWithConfiguration} from './internal/topic-client-props-with-config';
import {range} from '@gomomento/sdk-core/dist/src/internal/utils';

/**
 * Momento Topic Client.
 *
 * Publish and subscribe to topics.
 */
export class TopicClient extends AbstractTopicClient {
  /**
   * Creates an instance of TopicClient.
   */
  constructor(props: TopicClientProps) {
    const configuration: TopicConfiguration =
      props.configuration ?? getDefaultTopicClientConfiguration();
    const propsWithConfiguration: TopicClientPropsWithConfiguration = {
      ...props,
      configuration,
    };

    const numClients = configuration
      .getTransportStrategy()
      .getGrpcConfig()
      .getNumClients();

    super(
      configuration.getLoggerFactory().getLogger(TopicClient.name),
      range(numClients).map(_ => new PubsubClient(propsWithConfiguration)),
      new WebhookClient(propsWithConfiguration)
    );

    this.logger.debug('Instantiated Momento TopicClient');
  }
}

function getDefaultTopicClientConfiguration(): TopicConfiguration {
  return TopicConfigurations.Default.latest();
}
