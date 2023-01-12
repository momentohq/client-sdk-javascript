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

  constructor(grpcConfiguration: GrpcConfiguration) {
    this.grpcConfig = grpcConfiguration;
  }

  getGrpcConfig(): GrpcConfiguration {
    return this.grpcConfig;
  }

  withGrpcConfig(grpcConfig: GrpcConfiguration): StaticTransportStrategy {
    return new StaticTransportStrategy(grpcConfig);
  }

  withClientTimeoutMillis(clientTimeout: number): StaticTransportStrategy {
    return new StaticTransportStrategy(
      this.grpcConfig.withDeadlineMilliseconds(clientTimeout)
    );
  }
}
