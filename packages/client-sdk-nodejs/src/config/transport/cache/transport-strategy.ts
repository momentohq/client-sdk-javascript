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
   * @returns {number} the interval time in milliseconds for when each cache client should be re-initialized.
   */
  getMaxClientAgeMillis(): number | undefined;

  /**
   * Copy constructor to update the max idle connection timeout.  (See {getMaxIdleMillis}.)
   * @param {number} maxIdleMillis
   * @returns {TransportStrategy} a new TransportStrategy with the specified max idle connection timeout.
   */
  withMaxIdleMillis(maxIdleMillis: number): TransportStrategy;

  /**
   * Copy constructor to update the max client age in millis.  (See {getMaxClientAgeMillis}.)
   * @param {number} maxClientAgeMillis
   * @returns {TransportStrategy} a new TransportStrategy with the specified max client age.
   */
  withMaxClientAgeMillis(maxClientAgeMillis: number): TransportStrategy;

  /**
   * returns the maximum number of concurrent requests that can be made by the client.
   */
  getMaxConcurrentRequests(): number | undefined;

  /**
   * Copy constructor to update the maximum number of concurrent requests that can be made by the client.
   * @param {number} maxConcurrentRequests
   * @returns {TransportStrategy} a new TransportStrategy with the specified concurrent requests limit.
   */
  withMaxConcurrentRequests(maxConcurrentRequests: number): TransportStrategy;
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

  /**
   * Specifies the interval time in milliseconds for when each cache client should be re-initialized.
   */
  maxClientAgeMillis?: number;
}

export class StaticGrpcConfiguration implements GrpcConfiguration {
  private readonly deadlineMillis: number;
  private readonly maxSessionMemoryMb: number;
  private readonly numClients: number;
  private readonly maxConcurrentRequests?: number;
  private readonly keepAlivePermitWithoutCalls?: number;
  private readonly keepAliveTimeoutMs?: number;
  private readonly keepAliveTimeMs?: number;
  private readonly maxSendMessageLength?: number;
  private readonly maxReceiveMessageLength?: number;

  constructor(props: GrpcConfigurationProps) {
    this.deadlineMillis = props.deadlineMillis;
    this.maxSessionMemoryMb = props.maxSessionMemoryMb;
    if (props.numClients !== undefined && props.numClients !== null) {
      this.numClients = props.numClients;
    } else {
      // This is the previously hardcoded value and a safe default for most environments.
      this.numClients = 6;
    }
    this.maxConcurrentRequests = props.maxConcurrentRequests;
    this.keepAliveTimeMs = props.keepAliveTimeMs;
    this.keepAliveTimeoutMs = props.keepAliveTimeoutMs;
    this.keepAlivePermitWithoutCalls = props.keepAlivePermitWithoutCalls;
    this.maxSendMessageLength = props.maxSendMessageLength;
    this.maxReceiveMessageLength = props.maxReceiveMessageLength;
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

  getMaxSendMessageLength(): number | undefined {
    return this.maxSendMessageLength;
  }

  getMaxReceiveMessageLength(): number | undefined {
    return this.maxReceiveMessageLength;
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

  getMaxConcurrentRequests(): number | undefined {
    return this.maxConcurrentRequests;
  }

  withMaxConcurrentRequests(maxConcurrentRequests: number): GrpcConfiguration {
    return new StaticGrpcConfiguration({
      deadlineMillis: this.deadlineMillis,
      maxSessionMemoryMb: this.maxSessionMemoryMb,
      numClients: this.numClients,
      maxConcurrentRequests: maxConcurrentRequests,
    });
  }
}

export class StaticTransportStrategy implements TransportStrategy {
  private readonly grpcConfig: GrpcConfiguration;
  private readonly maxIdleMillis: number;
  private readonly maxClientAgeMillis?: number;

  constructor(props: TransportStrategyProps) {
    this.grpcConfig = props.grpcConfiguration;
    this.maxIdleMillis = props.maxIdleMillis;
    this.maxClientAgeMillis = props.maxClientAgeMillis;
  }

  getGrpcConfig(): GrpcConfiguration {
    return this.grpcConfig;
  }

  getMaxClientAgeMillis(): number | undefined {
    return this.maxClientAgeMillis;
  }

  withGrpcConfig(grpcConfig: GrpcConfiguration): StaticTransportStrategy {
    return new StaticTransportStrategy({
      grpcConfiguration: grpcConfig,
      maxIdleMillis: this.maxIdleMillis,
      maxClientAgeMillis: this.maxClientAgeMillis,
    });
  }

  getMaxIdleMillis(): number {
    return this.maxIdleMillis;
  }

  withMaxIdleMillis(maxIdleMillis: number): TransportStrategy {
    return new StaticTransportStrategy({
      grpcConfiguration: this.grpcConfig,
      maxIdleMillis: maxIdleMillis,
      maxClientAgeMillis: this.maxClientAgeMillis,
    });
  }

  withMaxClientAgeMillis(maxClientAgeMillis: number): TransportStrategy {
    return new StaticTransportStrategy({
      grpcConfiguration: this.grpcConfig,
      maxIdleMillis: this.maxIdleMillis,
      maxClientAgeMillis: maxClientAgeMillis,
    });
  }

  withClientTimeoutMillis(clientTimeout: number): StaticTransportStrategy {
    return new StaticTransportStrategy({
      grpcConfiguration: this.grpcConfig.withDeadlineMillis(clientTimeout),
      maxIdleMillis: this.maxIdleMillis,
    });
  }

  getMaxConcurrentRequests(): number | undefined {
    return this.grpcConfig.getMaxConcurrentRequests();
  }

  withMaxConcurrentRequests(
    maxConcurrentRequests: number
  ): StaticTransportStrategy {
    return new StaticTransportStrategy({
      grpcConfiguration: this.grpcConfig.withMaxConcurrentRequests(
        maxConcurrentRequests
      ),
      maxIdleMillis: this.maxIdleMillis,
    });
  }
}
