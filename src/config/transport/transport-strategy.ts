import {GrpcConfiguration} from './grpc-configuration';

/**
 * Configures the network options for communicating with the Momento service.
 * @export
 * @interface TransportStrategy
 */
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

export class StaticGrpcConfiguration implements GrpcConfiguration {
  private readonly deadlineMilliseconds: number;
  private readonly maxSessionMemory: number;
  constructor(deadlineMilliseconds: number, maxSessionMemory: number) {
    this.deadlineMilliseconds = deadlineMilliseconds;
    this.maxSessionMemory = maxSessionMemory;
  }

  getDeadlineMilliseconds(): number {
    return this.deadlineMilliseconds;
  }

  getMaxSessionMemoryMb(): number {
    return this.maxSessionMemory;
  }

  withDeadlineMilliseconds(
    deadlineMilliseconds: number
  ): StaticGrpcConfiguration {
    return new StaticGrpcConfiguration(
      deadlineMilliseconds,
      this.maxSessionMemory
    );
  }

  withMaxSessionMemoryMb(maxSessionMemory: number): StaticGrpcConfiguration {
    return new StaticGrpcConfiguration(
      this.deadlineMilliseconds,
      maxSessionMemory
    );
  }
}

export class StaticTransportStrategy implements TransportStrategy {
  private readonly grpcConfig: GrpcConfiguration;
  private readonly maxIdleMillis: number;

  constructor(grpcConfiguration: GrpcConfiguration, maxIdleMillis: number) {
    this.grpcConfig = grpcConfiguration;
    this.maxIdleMillis = maxIdleMillis;
  }

  getGrpcConfig(): GrpcConfiguration {
    return this.grpcConfig;
  }

  withGrpcConfig(grpcConfig: GrpcConfiguration): StaticTransportStrategy {
    return new StaticTransportStrategy(grpcConfig, this.maxIdleMillis);
  }

  getMaxIdleMillis(): number {
    return this.maxIdleMillis;
  }

  withMaxIdleMillis(maxIdleMillis: number): TransportStrategy {
    return new StaticTransportStrategy(this.grpcConfig, maxIdleMillis);
  }

  withClientTimeoutMillis(clientTimeout: number): StaticTransportStrategy {
    return new StaticTransportStrategy(
      this.grpcConfig.withDeadlineMilliseconds(clientTimeout),
      this.maxIdleMillis
    );
  }
}
