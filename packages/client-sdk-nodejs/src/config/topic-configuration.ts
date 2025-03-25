import {MomentoLoggerFactory} from '@gomomento/sdk-core';
import {TopicTransportStrategy} from './transport/topics';
import {Middleware} from './middleware/middleware';

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

  /**
   * Configures middleware functions that will wrap each request
   */
  middlewares: Middleware[];
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

  /**
   * @returns {Middleware[]} the middleware functions that will wrap each request
   */
  getMiddlewares(): Middleware[];

  /**
   * Copy constructor for configuring middleware functions that will wrap each request
   * @param {Middleware[]} middleware
   * @returns {TopicConfiguration} a new TopicConfiguration object with the specified middleware
   */
  withMiddlewares(middleware: Middleware[]): TopicConfiguration;

  /**
   * Copy constructor that adds a single middleware to the existing middlewares
   * @param {Middleware} middleware
   * @returns {TopicConfiguration} a new TopicConfiguration object with the specified Middleware appended to the list of existing Middlewares
   */
  addMiddleware(middleware: Middleware): TopicConfiguration;

  /**
   * Convenience copy constructor that updates the client-side timeout setting in the TransportStrategy
   * @param {number} clientTimeoutMillis
   * @returns {Configuration} a new TopicConfiguration object with its TransportStrategy updated to use the specified client timeout
   */
  withClientTimeoutMillis(clientTimeoutMillis: number): TopicConfiguration;
}

export class TopicClientConfiguration implements TopicConfiguration {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly transportStrategy: TopicTransportStrategy;
  private readonly throwOnErrors: boolean;
  private readonly middlewares: Middleware[];

  constructor(props: TopicConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
    this.transportStrategy = props.transportStrategy;
    this.throwOnErrors = props.throwOnErrors;
    this.middlewares = props.middlewares;
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
      ...this,
      transportStrategy,
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
      ...this,
      throwOnErrors,
    });
  }

  getMiddlewares(): Middleware[] {
    return this.middlewares;
  }

  withMiddlewares(middlewares: Middleware[]): TopicConfiguration {
    return new TopicClientConfiguration({
      ...this,
      middlewares,
    });
  }

  addMiddleware(middleware: Middleware): TopicConfiguration {
    return new TopicClientConfiguration({
      ...this,
      middlewares: [middleware, ...this.middlewares],
    });
  }

  withClientTimeoutMillis(clientTimeoutMillis: number): TopicConfiguration {
    return new TopicClientConfiguration({
      ...this,
      transportStrategy:
        this.transportStrategy.withClientTimeoutMillis(clientTimeoutMillis),
    });
  }
}
