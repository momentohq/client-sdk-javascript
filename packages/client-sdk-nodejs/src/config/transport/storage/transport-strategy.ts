import {
  StorageGrpcConfiguration,
  StorageGrpcConfigurationProps,
} from './grpc-configuration';

export interface StorageTransportStrategy {
  /**
   * Configures the low-level gRPC settings for the Momento client's communication
   * with the Momento server.
   * @returns {StorageGrpcConfiguration}
   */
  getGrpcConfig(): StorageGrpcConfiguration;

  /**
   * Copy constructor for overriding the gRPC configuration
   * @param {TopicGrpcConfiguration} grpcConfig
   * @returns {TopicTransportStrategy} a new StorageTransportStrategy with the specified gRPC config.
   */
  withGrpcConfig(
    grpcConfig: StorageGrpcConfiguration
  ): StorageTransportStrategy;

  /**
   * Copy constructor to update the client-side timeout
   * @param {number} clientTimeoutMillis
   * @returns {StorageTransportStrategy} a new StorageTransportStrategy with the specified client timeout
   */
  withClientTimeoutMillis(
    clientTimeoutMillis: number
  ): StorageTransportStrategy;
}

export interface StorageTransportStrategyProps {
  /**
   * low-level gRPC settings for communication with the Momento server
   */
  grpcConfiguration: StorageGrpcConfiguration;
}

export class StaticStorageGrpcConfiguration
  implements StorageGrpcConfiguration
{
  private readonly deadlineMillis: number;

  constructor(props: StorageGrpcConfigurationProps) {
    this.deadlineMillis = props.deadlineMillis;
  }

  getDeadlineMillis(): number {
    return this.deadlineMillis;
  }

  withDeadlineMillis(deadlineMillis: number): StorageGrpcConfiguration {
    return new StaticStorageGrpcConfiguration({
      deadlineMillis: deadlineMillis,
    });
  }
}

export class StaticStorageTransportStrategy
  implements StorageTransportStrategy
{
  private readonly grpcConfig: StorageGrpcConfiguration;

  constructor(props: StorageTransportStrategyProps) {
    this.grpcConfig = props.grpcConfiguration;
  }

  getGrpcConfig(): StorageGrpcConfiguration {
    return this.grpcConfig;
  }

  withGrpcConfig(
    grpcConfig: StorageGrpcConfiguration
  ): StorageTransportStrategy {
    return new StaticStorageTransportStrategy({
      grpcConfiguration: grpcConfig,
    });
  }

  withClientTimeoutMillis(
    clientTimeoutMillis: number
  ): StorageTransportStrategy {
    return new StaticStorageTransportStrategy({
      grpcConfiguration:
        this.grpcConfig.withDeadlineMillis(clientTimeoutMillis),
    });
  }
}
