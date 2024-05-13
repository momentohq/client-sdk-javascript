import {MomentoLoggerFactory} from '@gomomento/sdk-core';
import {TopicTransportStrategy} from './transport/topics';

export interface TopicConfigurationProps {
  /**
   * Configures logging verbosity and format
   */
  loggerFactory: MomentoLoggerFactory;

  /**
   * Configures low-level options for network interactions with the Momento service
   */
  transportStrategy: TopicTransportStrategy;

  /**
   * Configures whether the client should return a Momento Error object or throw an exception when an error occurs.
   */
  throwOnErrors: boolean;
}

/**
 * Configuration options for Momento TopicClient
 *
 * @export
 * @interface TopicConfiguration
 */
export interface TopicConfiguration {
  /**
   * @returns {MomentoLoggerFactory} the current configuration options for logging verbosity and format
   */
  getLoggerFactory(): MomentoLoggerFactory;

  /**
   * @returns {TransportStrategy} the current configuration options for wire interactions with the Momento service
   */
  getTransportStrategy(): TopicTransportStrategy;

  /**
   * Shorthand copy constructor for overriding TransportStrategy.GrpcStrategy.NumClients. This will
   * allow you to control the number of TCP connections that the client will open to the server. Usually
   * you should stick with the default value from your pre-built configuration, but it can be valuable
   * to increase this value in order to ensure more evenly distributed load on Momento servers.
   *
   * @param {number} numConnections
   * @returns {Configuration} a new Configuration object with the updated TransportStrategy
   */
  withNumConnections(numConnections: number): TopicConfiguration;

  /**
   * @returns {boolean} Configures whether the client should return a Momento Error object or throw an exception when an
   * error occurs. By default, this is set to false, and the client will return a Momento Error object on errors. Set it
   * to true if you prefer for exceptions to be thrown.
   */
  getThrowOnErrors(): boolean;

  /**
   * Copy constructor for configuring whether the client should return a Momento Error object or throw an exception when an
   * error occurs. By default, this is set to false, and the client will return a Momento Error object on errors. Set it
   * to true if you prefer for exceptions to be thrown.
   * @param {boolean} throwOnErrors
   * @returns {Configuration} a new Configuration object with the specified throwOnErrors setting
   */
  withThrowOnErrors(throwOnErrors: boolean): TopicConfiguration;
}

export class TopicClientConfiguration implements TopicConfiguration {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly transportStrategy: TopicTransportStrategy;
  private readonly throwOnErrors: boolean;

  constructor(props: TopicConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
    this.transportStrategy = props.transportStrategy;
    this.throwOnErrors = props.throwOnErrors;
  }

  getLoggerFactory(): MomentoLoggerFactory {
    return this.loggerFactory;
  }

  getTransportStrategy(): TopicTransportStrategy {
    return this.transportStrategy;
  }

  withTransportStrategy(
    transportStrategy: TopicTransportStrategy
  ): TopicConfiguration {
    return new TopicClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: transportStrategy,
      throwOnErrors: this.throwOnErrors,
    });
  }

  withNumConnections(numConnections: number): TopicConfiguration {
    return this.withTransportStrategy(
      this.getTransportStrategy().withGrpcConfig(
        this.getTransportStrategy()
          .getGrpcConfig()
          .withNumClients(numConnections)
      )
    );
  }

  getThrowOnErrors(): boolean {
    return this.throwOnErrors;
  }

  withThrowOnErrors(throwOnErrors: boolean): TopicConfiguration {
    return new TopicClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: this.transportStrategy,
      throwOnErrors: throwOnErrors,
    });
  }
}
