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
   * @param {number} requestTimeoutMillis
   * @returns {StorageTransportStrategy} a new StorageTransportStrategy with the specified client timeout
   */
  withRequestTimeoutMillis(
    requestTimeoutMillis: number
  ): StorageTransportStrategy;

  /**
   * Copy constructor to update the ResponseDataReceivedTimeout
   * @param {number} responseDataReceivedTimeoutMillis
   * @returns {StorageTransportStrategy} a new StorageTransportStrategy with the specified client timeout
   */
  withResponseDataReceivedTimeout(
    responseDataReceivedTimeoutMillis: number
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
  private readonly responseDataReceivedTimeoutMillis: number;

  constructor(props: StorageGrpcConfigurationProps) {
    this.deadlineMillis = props.deadlineMillis;
    this.responseDataReceivedTimeoutMillis =
      props.responseDataReceivedTimeoutMillis;
  }

  getDeadlineMillis(): number {
    return this.deadlineMillis;
  }

  withDeadlineMillis(deadlineMillis: number): StorageGrpcConfiguration {
    return new StaticStorageGrpcConfiguration({
      deadlineMillis: deadlineMillis,
      responseDataReceivedTimeoutMillis: this.responseDataReceivedTimeoutMillis,
    });
  }

  getResponseDataReceivedTimeoutMillis(): number {
    return this.responseDataReceivedTimeoutMillis;
  }

  withResponseDataReceivedTimeoutMillis(
    responseDataReceivedTimeoutMillis: number
  ): StorageGrpcConfiguration {
    return new StaticStorageGrpcConfiguration({
      deadlineMillis: this.deadlineMillis,
      responseDataReceivedTimeoutMillis: responseDataReceivedTimeoutMillis,
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

  withRequestTimeoutMillis(
    requestTimeoutMillis: number
  ): StorageTransportStrategy {
    return new StaticStorageTransportStrategy({
      grpcConfiguration:
        this.grpcConfig.withDeadlineMillis(requestTimeoutMillis),
    });
  }

  withResponseDataReceivedTimeout(
    responseDataReceivedTimeoutMillis: number
  ): StorageTransportStrategy {
    return new StaticStorageTransportStrategy({
      grpcConfiguration: this.grpcConfig.withResponseDataReceivedTimeoutMillis(
        responseDataReceivedTimeoutMillis
      ),
    });
  }
}
