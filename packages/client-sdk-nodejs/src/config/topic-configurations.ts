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
import {Middleware} from './middleware/middleware';

const defaultLoggerFactory: MomentoLoggerFactory =
  new DefaultMomentoLoggerFactory();
const defaultMiddlewares: Middleware[] = [];

export const NUM_DEFAULT_STREAM_CLIENTS = 4;
export const NUM_DEFAULT_UNARY_CLIENTS = 4;
export const NUM_DEFAULT_CLIENTS = 4;

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
          numClients: NUM_DEFAULT_CLIENTS,
          numStreamClients: NUM_DEFAULT_STREAM_CLIENTS,
          numUnaryClients: NUM_DEFAULT_UNARY_CLIENTS,
          keepAlivePermitWithoutCalls: 1,
          keepAliveTimeMs: 5000,
          keepAliveTimeoutMs: 1000,
          deadlineMillis: 5000,
        }),
      }),
      throwOnErrors: false,
      middlewares: defaultMiddlewares,
    });
  }
}

/**
 * Default config provides defaults suitable for AWS lambda or similar environments; relaxes timeouts, disables keep-alives
 * to avoid issues with execution environments being frozen and resumed, etc.
 * @export
 * @class Lambda
 */
export class Lambda extends TopicClientConfiguration {
  /**
   * Provides the latest recommended configuration for a lambda environment.  NOTE: this configuration may
   * change in future releases to take advantage of improvements we identify for default configurations.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {CacheConfiguration}
   */
  static latest(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): TopicClientConfiguration {
    const grpcConfig = new StaticTopicGrpcConfiguration({
      numClients: NUM_DEFAULT_CLIENTS,
      numStreamClients: NUM_DEFAULT_STREAM_CLIENTS,
      numUnaryClients: NUM_DEFAULT_UNARY_CLIENTS,
      deadlineMillis: 5000,
    });
    const transportStrategy = new StaticTopicTransportStrategy({
      grpcConfiguration: grpcConfig,
    });
    return new Lambda({
      loggerFactory: loggerFactory,
      transportStrategy: transportStrategy,
      throwOnErrors: false,
      middlewares: defaultMiddlewares,
    });
  }
}
