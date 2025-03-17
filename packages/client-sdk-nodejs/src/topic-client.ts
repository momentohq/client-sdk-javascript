import {AbstractTopicClient} from '@gomomento/sdk-core/dist/src/internal/clients/pubsub/AbstractTopicClient';
import {TopicConfiguration, TopicConfigurations} from '.';
import {PubsubClient} from './internal/pubsub-client';
import {TopicClientProps} from './topic-client-props';
import {WebhookClient} from './internal/webhook-client';
import {TopicClientAllProps} from './internal/topic-client-all-props';
import {range} from '@gomomento/sdk-core/dist/src/internal/utils';
import {getDefaultCredentialProvider} from '@gomomento/sdk-core';

/**
 * Momento Topic Client.
 *
 * Publish and subscribe to topics.
 */
export class TopicClient extends AbstractTopicClient {
  /**
   * Creates an instance of TopicClient.
   */
  constructor(props?: TopicClientProps) {
    const allProps: TopicClientAllProps = {
      credentialProvider:
        props?.credentialProvider ?? getDefaultCredentialProvider(),
      configuration:
        props?.configuration ?? getDefaultTopicClientConfiguration(),
    };

    const numClients = allProps.configuration
      .getTransportStrategy()
      .getGrpcConfig()
      .getNumClients();

    super(
      allProps.configuration.getLoggerFactory().getLogger(TopicClient.name),
      range(numClients).map(_ => new PubsubClient(allProps)),
      new WebhookClient(allProps)
    );

    this.logger.debug('Instantiated Momento TopicClient');

    allProps.configuration.getMiddlewares().forEach(m => {
      if (m.init) {
        m.init();
      }
    });
  }
}

function getDefaultTopicClientConfiguration(): TopicConfiguration {
  const config = TopicConfigurations.Default.latest();
  const logger = config.getLoggerFactory().getLogger('TopicClient');
  logger.info(
    'No configuration provided to TopicClient. Using latest "Default" configuration, suitable for development. For production use, consider specifying an explicit configuration.'
  );
  return config;
}
