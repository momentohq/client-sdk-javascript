import {GrpcConfiguration, GrpcConfigurationProps} from './grpc-configuration';

export interface TransportStrategy {
  /**
   * Configures the low-level gRPC settings for the Momento client's communication
   * with the Momento server.
   * @returns {GrpcConfiguration}
   */
  getGrpcConfig(): GrpcConfiguration;

  /**
   * Copy constructor for overriding the gRPC configuration
   * @param {GrpcConfiguration} grpcConfig
   * @returns {TransportStrategy} a new TransportStrategy with the specified gRPC config.
   */
  withGrpcConfig(grpcConfig: GrpcConfiguration): TransportStrategy;

  /**
   * Copy constructor to update the client-side timeout
   * @param {number} clientTimeoutMillis
   * @returns {TransportStrategy} a new TransportStrategy with the specified client timeout
   */
  withClientTimeoutMillis(clientTimeoutMillis: number): TransportStrategy;
}

export interface TransportStrategyProps {
  /**
   * low-level gRPC settings for communication with the Momento server
   */
  grpcConfiguration: GrpcConfiguration;
}

export class StaticGrpcConfiguration implements GrpcConfiguration {
  private readonly deadlineMillis: number;

  constructor(props: GrpcConfigurationProps) {
    this.deadlineMillis = props.deadlineMillis;
  }

  getDeadlineMillis(): number {
    return this.deadlineMillis;
  }

  withDeadlineMillis(deadlineMillis: number): StaticGrpcConfiguration {
    return new StaticGrpcConfiguration({
      ...this,
      deadlineMillis,
    });
  }
}

export class StaticTransportStrategy implements TransportStrategy {
  private readonly grpcConfiguration: GrpcConfiguration;

  constructor(props: TransportStrategyProps) {
    this.grpcConfiguration = props.grpcConfiguration;
  }

  getGrpcConfig(): GrpcConfiguration {
    return this.grpcConfiguration;
  }

  withGrpcConfig(
    grpcConfiguration: GrpcConfiguration
  ): StaticTransportStrategy {
    return new StaticTransportStrategy({
      ...this,
      grpcConfiguration,
    });
  }

  withClientTimeoutMillis(clientTimeout: number): StaticTransportStrategy {
    return new StaticTransportStrategy({
      ...this,
      grpcConfiguration:
        this.grpcConfiguration.withDeadlineMillis(clientTimeout),
    });
  }
}
