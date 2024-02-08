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

  /**
   * Copy constructor to update the max idle connection timeout.  (See {getMaxIdleMillis}.)
   * @param {number} maxIdleMillis
   * @returns {TransportStrategy} a new TransportStrategy with the specified max idle connection timeout.
   */
  withMaxIdleMillis(maxIdleMillis: number): TransportStrategy;
}

export interface TransportStrategyProps {
  /**
   * low-level gRPC settings for communication with the Momento server
   */
  grpcConfiguration: GrpcConfiguration;
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

export class StaticGrpcConfiguration implements GrpcConfiguration {
  private readonly deadlineMillis: number;
  private readonly maxSessionMemoryMb: number;
  private readonly numClients: number;
  private keepAlivePermitWithoutCalls?: number;
  private keepAliveTimeoutMs?: number;
  private keepAliveTimeMs?: number;

  constructor(props: GrpcConfigurationProps) {
    this.deadlineMillis = props.deadlineMillis;
    this.maxSessionMemoryMb = props.maxSessionMemoryMb;
    if (props.numClients !== undefined && props.numClients !== null) {
      this.numClients = props.numClients;
    } else {
      // This is the previously hardcoded value and a safe default for most environments.
      this.numClients = 6;
    }
    this.keepAliveTimeMs = props.keepAliveTimeMs;
    this.keepAliveTimeoutMs = props.keepAliveTimeoutMs;
    this.keepAlivePermitWithoutCalls = props.keepAlivePermitWithoutCalls;
  }

  getDeadlineMillis(): number {
    return this.deadlineMillis;
  }

  getMaxSessionMemoryMb(): number {
    return this.maxSessionMemoryMb;
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

  withDeadlineMillis(deadlineMillis: number): StaticGrpcConfiguration {
    return new StaticGrpcConfiguration({
      deadlineMillis: deadlineMillis,
      maxSessionMemoryMb: this.maxSessionMemoryMb,
      numClients: this.numClients,
    });
  }

  withMaxSessionMemoryMb(maxSessionMemoryMb: number): StaticGrpcConfiguration {
    return new StaticGrpcConfiguration({
      deadlineMillis: this.deadlineMillis,
      maxSessionMemoryMb: maxSessionMemoryMb,
      numClients: this.numClients,
    });
  }

  getNumClients(): number {
    return this.numClients;
  }

  withNumClients(numClients: number): GrpcConfiguration {
    return new StaticGrpcConfiguration({
      deadlineMillis: this.deadlineMillis,
      maxSessionMemoryMb: this.maxSessionMemoryMb,
      numClients: numClients,
    });
  }
}

export class StaticTransportStrategy implements TransportStrategy {
  private readonly grpcConfig: GrpcConfiguration;
  private readonly maxIdleMillis: number;

  constructor(props: TransportStrategyProps) {
    this.grpcConfig = props.grpcConfiguration;
    this.maxIdleMillis = props.maxIdleMillis;
  }

  getGrpcConfig(): GrpcConfiguration {
    return this.grpcConfig;
  }

  withGrpcConfig(grpcConfig: GrpcConfiguration): StaticTransportStrategy {
    return new StaticTransportStrategy({
      grpcConfiguration: grpcConfig,
      maxIdleMillis: this.maxIdleMillis,
    });
  }

  getMaxIdleMillis(): number {
    return this.maxIdleMillis;
  }

  withMaxIdleMillis(maxIdleMillis: number): TransportStrategy {
    return new StaticTransportStrategy({
      grpcConfiguration: this.grpcConfig,
      maxIdleMillis: maxIdleMillis,
    });
  }

  withClientTimeoutMillis(clientTimeout: number): StaticTransportStrategy {
    return new StaticTransportStrategy({
      grpcConfiguration: this.grpcConfig.withDeadlineMillis(clientTimeout),
      maxIdleMillis: this.maxIdleMillis,
    });
  }
}
