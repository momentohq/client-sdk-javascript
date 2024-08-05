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
   * Configures time to wait for response data to be received before retrying (defaults to 1s).
   * @returns {StorageGrpcConfiguration}
   */
  getResponseDataReceivedTimeout(): number;

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
   * @param {number} responseDataReceivedTimeout
   * @returns {StorageTransportStrategy} a new StorageTransportStrategy with the specified client timeout
   */
  withResponseDataReceivedTimeout(
    responseDataReceivedTimeout: number
  ): StorageTransportStrategy;
}

export interface StorageTransportStrategyProps {
  /**
   * low-level gRPC settings for communication with the Momento server
   */
  grpcConfiguration: StorageGrpcConfiguration;
  /**
   * time to wait for response data to be received before retrying (defaults to 1s)
   */
  responseDataReceivedTimeout?: number;
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
  private readonly responseDataReceivedTimeout: number;

  constructor(props: StorageTransportStrategyProps) {
    this.grpcConfig = props.grpcConfiguration;
    this.responseDataReceivedTimeout =
      props.responseDataReceivedTimeout ?? 1000;
  }

  getGrpcConfig(): StorageGrpcConfiguration {
    return this.grpcConfig;
  }

  getResponseDataReceivedTimeout(): number {
    return this.responseDataReceivedTimeout;
  }

  withGrpcConfig(
    grpcConfig: StorageGrpcConfiguration
  ): StorageTransportStrategy {
    return new StaticStorageTransportStrategy({
      grpcConfiguration: grpcConfig,
      responseDataReceivedTimeout: this.responseDataReceivedTimeout,
    });
  }

  withRequestTimeoutMillis(
    requestTimeoutMillis: number
  ): StorageTransportStrategy {
    return new StaticStorageTransportStrategy({
      grpcConfiguration:
        this.grpcConfig.withDeadlineMillis(requestTimeoutMillis),
      responseDataReceivedTimeout: this.responseDataReceivedTimeout,
    });
  }

  withResponseDataReceivedTimeout(
    responseDataReceivedTimeout: number
  ): StorageTransportStrategy {
    return new StaticStorageTransportStrategy({
      grpcConfiguration: this.grpcConfig,
      responseDataReceivedTimeout: responseDataReceivedTimeout,
    });
  }
}
