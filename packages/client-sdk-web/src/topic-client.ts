import {TopicConfiguration, TopicConfigurations} from '.';
import {PubsubClient} from './internal/pubsub-client';
import {TopicClientProps} from './topic-client-props';
import {AbstractTopicClient} from '@gomomento/sdk-core/dist/src/internal/clients/pubsub/AbstractTopicClient';
import {WebhookClient} from './internal/webhook-client';
import {TopicClientPropsWithConfiguration} from './internal/topic-client-props-with-config';

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
    const configuration =
      props.configuration ?? getDefaultTopicClientConfiguration();
    const propsWithConfig: TopicClientPropsWithConfiguration = {
      ...props,
      configuration,
    };

    super(
      configuration.getLoggerFactory().getLogger(TopicClient.name),
      [new PubsubClient(propsWithConfig)],
      new WebhookClient(propsWithConfig)
    );
    this.logger.debug('Instantiated Momento TopicClient');
  }
}

function getDefaultTopicClientConfiguration(): TopicConfiguration {
  return TopicConfigurations.Default.latest();
}
