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

  /**
   * Copy constructor to update the max idle connection timeout.  (See {getMaxIdleMillis}.)
   * @param {number} maxIdleMillis
   * @returns {StorageTransportStrategy} a new StorageTransportStrategy with the specified max idle connection timeout.
   */
  withMaxIdleMillis(maxIdleMillis: number): StorageTransportStrategy;

  /**
   * The maximum duration for which a connection may remain idle before being replaced.  This
   * setting can be used to force re-connection of a client if it has been idle for too long.
   * In environments such as AWS lambda, if the lambda is suspended for too long the connection
   * may be closed by the load balancer, resulting in an error on the subsequent request.  If
   * this setting is set to a duration less than the load balancer timeout, we can ensure that
   * the connection will be refreshed to avoid errors.
   * @returns {number}
   */
  getMaxIdleMillis(): number;
}

export interface StorageTransportStrategyProps {
  /**
   * low-level gRPC settings for communication with the Momento server
   */
  grpcConfiguration: StorageGrpcConfiguration;
  /**
   * The maximum duration for which a connection may remain idle before being replaced.  This
   * setting can be used to force re-connection of a client if it has been idle for too long.
   * In environments such as AWS lambda, if the lambda is suspended for too long the connection
   * may be closed by the load balancer, resulting in an error on the subsequent request.  If
   * this setting is set to a duration less than the load balancer timeout, we can ensure that
   * the connection will be refreshed to avoid errors.
   * @returns {number}
   */
  maxIdleMillis: number;
}

export class StaticStorageGrpcConfiguration
  implements StorageGrpcConfiguration
{
  private readonly numClients: number;
  private readonly deadlineMillis: number;
  private readonly maxSessionMemoryMb: number;

  constructor(props: StorageGrpcConfigurationProps) {
    if (props.numClients !== undefined && props.numClients !== null) {
      this.numClients = props.numClients;
    } else {
      this.numClients = 1;
    }
    this.deadlineMillis = props.deadlineMillis;
    this.maxSessionMemoryMb = props.maxSessionMemoryMb;
  }

  getNumClients(): number {
    return this.numClients;
  }

  withNumClients(numClients: number): StorageGrpcConfiguration {
    return new StaticStorageGrpcConfiguration({
      numClients: numClients,
      deadlineMillis: this.deadlineMillis,
      maxSessionMemoryMb: this.maxSessionMemoryMb,
    });
  }

  getDeadlineMillis(): number {
    return this.deadlineMillis;
  }

  withDeadlineMillis(deadlineMillis: number): StorageGrpcConfiguration {
    return new StaticStorageGrpcConfiguration({
      deadlineMillis: deadlineMillis,
      numClients: this.numClients,
      maxSessionMemoryMb: this.maxSessionMemoryMb,
    });
  }

  getMaxSessionMemoryMb(): number {
    return this.maxSessionMemoryMb;
  }

  withMaxSessionMemoryMb(maxSessionMemoryMb: number): StorageGrpcConfiguration {
    return new StaticStorageGrpcConfiguration({
      deadlineMillis: this.deadlineMillis,
      numClients: this.numClients,
      maxSessionMemoryMb: maxSessionMemoryMb,
    });
  }
}

export class StaticStorageTransportStrategy
  implements StorageTransportStrategy
{
  private readonly grpcConfig: StorageGrpcConfiguration;
  private readonly maxIdleMillis: number;

  constructor(props: StorageTransportStrategyProps) {
    this.grpcConfig = props.grpcConfiguration;
    this.maxIdleMillis = props.maxIdleMillis;
  }

  getGrpcConfig(): StorageGrpcConfiguration {
    return this.grpcConfig;
  }

  withGrpcConfig(
    grpcConfig: StorageGrpcConfiguration
  ): StorageTransportStrategy {
    return new StaticStorageTransportStrategy({
      grpcConfiguration: grpcConfig,
      maxIdleMillis: this.maxIdleMillis,
    });
  }

  withClientTimeoutMillis(
    clientTimeoutMillis: number
  ): StorageTransportStrategy {
    return new StaticStorageTransportStrategy({
      grpcConfiguration:
        this.grpcConfig.withDeadlineMillis(clientTimeoutMillis),
      maxIdleMillis: this.maxIdleMillis,
    });
  }

  getMaxIdleMillis(): number {
    return this.maxIdleMillis;
  }

  withMaxIdleMillis(maxIdleMillis: number): StorageTransportStrategy {
    return new StaticStorageTransportStrategy({
      grpcConfiguration: this.grpcConfig,
      maxIdleMillis: maxIdleMillis,
    });
  }
}
