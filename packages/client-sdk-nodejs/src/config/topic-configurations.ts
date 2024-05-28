import {MomentoLoggerFactory} from '@gomomento/sdk-core';
import {DefaultMomentoLoggerFactory} from './logging/default-momento-logger';
import {
  TopicClientConfiguration,
  TopicConfiguration,
} from './topic-configuration';
import {
  StaticTopicGrpcConfiguration,
  StaticTopicTransportStrategy,
} from './transport/topics';

const defaultLoggerFactory: MomentoLoggerFactory =
  new DefaultMomentoLoggerFactory();

/**
 * Default config provides defaults suitable for most environments; prioritizes success of publishing and receiving messages.
 * @export
 * @class Default
 */
export class Default extends TopicClientConfiguration {
  /**
   * Provides the latest recommended configuration for a default environment.  NOTE: this configuration may
   * change in future releases to take advantage of improvements we identify for default configurations.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {TopicConfiguration}
   */
  static latest(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): TopicConfiguration {
    return new TopicClientConfiguration({
      loggerFactory: loggerFactory,
      transportStrategy: new StaticTopicTransportStrategy({
        grpcConfiguration: new StaticTopicGrpcConfiguration({
          numClients: 1,
        }),
      }),
      throwOnErrors: false,
    });
  }
}
