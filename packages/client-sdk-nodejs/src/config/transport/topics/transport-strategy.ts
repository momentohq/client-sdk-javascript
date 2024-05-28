import {
  TopicGrpcConfiguration,
  TopicGrpcConfigurationProps,
} from './grpc-configuration';

export interface TopicTransportStrategy {
  /**
   * Configures the low-level gRPC settings for the Momento client's communication
   * with the Momento server.
   * @returns {TopicGrpcConfiguration}
   */
  getGrpcConfig(): TopicGrpcConfiguration;

  /**
   * Copy constructor for overriding the gRPC configuration
   * @param {TopicGrpcConfiguration} grpcConfig
   * @returns {TopicTransportStrategy} a new TransportStrategy with the specified gRPC config.
   */
  withGrpcConfig(grpcConfig: TopicGrpcConfiguration): TopicTransportStrategy;
}

export interface TopicTransportStrategyProps {
  /**
   * low-level gRPC settings for communication with the Momento server
   */
  grpcConfiguration: TopicGrpcConfiguration;
}

export class StaticTopicGrpcConfiguration implements TopicGrpcConfiguration {
  private readonly numClients: number;

  constructor(props: TopicGrpcConfigurationProps) {
    if (props.numClients !== undefined && props.numClients !== null) {
      this.numClients = props.numClients;
    } else {
      this.numClients = 1;
    }
  }

  getNumClients(): number {
    return this.numClients;
  }

  withNumClients(numClients: number): TopicGrpcConfiguration {
    return new StaticTopicGrpcConfiguration({
      numClients: numClients,
    });
  }
}

export class StaticTopicTransportStrategy implements TopicTransportStrategy {
  private readonly grpcConfig: TopicGrpcConfiguration;

  constructor(props: TopicTransportStrategyProps) {
    this.grpcConfig = props.grpcConfiguration;
  }

  getGrpcConfig(): TopicGrpcConfiguration {
    return this.grpcConfig;
  }

  withGrpcConfig(
    grpcConfig: TopicGrpcConfiguration
  ): StaticTopicTransportStrategy {
    return new StaticTopicTransportStrategy({
      grpcConfiguration: grpcConfig,
    });
  }
}
