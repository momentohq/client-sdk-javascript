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

  /**
   * Copy constructor to update the client-side timeout
   * @param {number} clientTimeoutMillis
   * @returns {TopicTransportStrategy} a new TopicTransportStrategy with the specified client timeout
   */
  withClientTimeoutMillis(clientTimeoutMillis: number): TopicTransportStrategy;
}

export interface TopicTransportStrategyProps {
  /**
   * low-level gRPC settings for communication with the Momento server
   */
  grpcConfiguration: TopicGrpcConfiguration;
}

export class StaticTopicGrpcConfiguration implements TopicGrpcConfiguration {
  private readonly numClients: number;
  private readonly keepAlivePermitWithoutCalls?: number;
  private readonly keepAliveTimeoutMs?: number;
  private readonly keepAliveTimeMs?: number;
  private readonly deadlineMillis: number;

  constructor(props: TopicGrpcConfigurationProps) {
    if (props.numClients !== undefined && props.numClients !== null) {
      this.numClients = props.numClients;
    } else {
      this.numClients = 1;
    }

    this.keepAliveTimeMs = props.keepAliveTimeMs;
    this.keepAliveTimeoutMs = props.keepAliveTimeoutMs;
    this.keepAlivePermitWithoutCalls = props.keepAlivePermitWithoutCalls;
    this.deadlineMillis = props.deadlineMillis;
  }

  getNumClients(): number {
    return this.numClients;
  }

  withNumClients(numClients: number): TopicGrpcConfiguration {
    return new StaticTopicGrpcConfiguration({
      ...this,
      numClients,
    });
  }

  getKeepAliveTimeoutMS(): number | undefined {
    return this.keepAliveTimeoutMs;
  }

  getKeepAliveTimeMS(): number | undefined {
    return this.keepAliveTimeMs;
  }

  getKeepAlivePermitWithoutCalls(): number | undefined {
    return this.keepAlivePermitWithoutCalls;
  }

  getDeadlineMillis(): number {
    return this.deadlineMillis;
  }

  withDeadlineMillis(deadlineMillis: number): StaticTopicGrpcConfiguration {
    return new StaticTopicGrpcConfiguration({
      ...this,
      deadlineMillis,
    });
  }
}

export class StaticTopicTransportStrategy implements TopicTransportStrategy {
  private readonly grpcConfiguration: TopicGrpcConfiguration;

  constructor(props: TopicTransportStrategyProps) {
    this.grpcConfiguration = props.grpcConfiguration;
  }

  getGrpcConfig(): TopicGrpcConfiguration {
    return this.grpcConfiguration;
  }

  withGrpcConfig(
    grpcConfiguration: TopicGrpcConfiguration
  ): StaticTopicTransportStrategy {
    return new StaticTopicTransportStrategy({
      ...this,
      grpcConfiguration,
    });
  }

  withClientTimeoutMillis(
    clientTimeoutMillis: number
  ): StaticTopicTransportStrategy {
    return new StaticTopicTransportStrategy({
      ...this,
      grpcConfiguration:
        this.grpcConfiguration.withDeadlineMillis(clientTimeoutMillis),
    });
  }
}
