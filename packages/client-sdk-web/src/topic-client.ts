import {MomentoLogger} from '.';
import {PubsubClient} from './internal/pubsub-client';
import {TopicClientProps} from './topic-client-props';
import {IPubsubClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {AbstractTopicClient} from '@gomomento/sdk-core/dist/src/internal/clients/pubsub/AbstractTopicClient';

/**
 * Momento Topic Client.
 *
 * Publish and subscribe to topics.
 */
export class TopicClient extends AbstractTopicClient {
  protected readonly logger: MomentoLogger;
  protected readonly client: IPubsubClient;

  /**
   * Creates an instance of TopicClient.
   */
  constructor(props: TopicClientProps) {
    super();
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.logger.info('Creating Momento CacheClient');

    this.client = new PubsubClient(props);
  }
}
