import {MomentoLoggerFactory} from '@gomomento/sdk-core';
import {TransportStrategy} from './transport';
import {Middleware} from './middleware/middleware';

export interface ConfigurationProps {
  /**
   * Configures logging verbosity and format
   */
  loggerFactory: MomentoLoggerFactory;

  /**
   * Configures low-level options for network interactions with the Momento service
   */
  transportStrategy: TransportStrategy;

  /**
   * Configures middleware functions that will wrap each request
   */
  middlewares: Middleware[];

  /**
   * Configures whether the client should return a Momento Error object or throw an exception when an error occurs.
   */
  throwOnErrors: boolean;
}

/**
 * Configuration options for Momento Simple Cache client.
 *
 * @export
 * @interface Configuration
 */
export interface Configuration {
  /**
   * @returns {MomentoLoggerFactory} the current configuration options for logging verbosity and format
   */
  getLoggerFactory(): MomentoLoggerFactory;

  /**
   * @returns {TransportStrategy} the current configuration options for wire interactions with the Momento service
   */
  getTransportStrategy(): TransportStrategy;

  /**
   * Copy constructor for overriding TransportStrategy
   * @param {TransportStrategy} transportStrategy
   * @returns {Configuration} a new Configuration object with the specified TransportStrategy
   */
  withTransportStrategy(transportStrategy: TransportStrategy): Configuration;

  /**
   * @returns {Middleware[]} the middleware functions that will wrap each request
   */
  getMiddlewares(): Middleware[];

  /**
   * Copy constructor for overriding Middlewares
   * @param {Middleware[]} middlewares
   * @returns {Configuration} a new Configuration object with the specified Middlewares
   */
  withMiddlewares(middlewares: Middleware[]): Configuration;

  /**
   * Convenience copy constructor that updates the client-side timeout setting in the TransportStrategy
   * @param {number} clientTimeoutMillis
   * @returns {Configuration} a new Configuration object with its TransportStrategy updated to use the specified client timeout
   */
  withClientTimeoutMillis(clientTimeoutMillis: number): Configuration;

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
  withThrowOnErrors(throwOnErrors: boolean): Configuration;
}

export class CacheConfiguration implements Configuration {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly transportStrategy: TransportStrategy;
  private readonly middlewares: Middleware[] = [];
  private readonly throwOnErrors: boolean;

  constructor(props: ConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
    this.transportStrategy = props.transportStrategy;
    this.middlewares = props.middlewares;
    this.throwOnErrors = props.throwOnErrors;
  }

  getLoggerFactory(): MomentoLoggerFactory {
    return this.loggerFactory;
  }

  getTransportStrategy(): TransportStrategy {
    return this.transportStrategy;
  }

  withTransportStrategy(transportStrategy: TransportStrategy): Configuration {
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: transportStrategy,
      middlewares: this.middlewares,
      throwOnErrors: this.throwOnErrors,
    });
  }

  getMiddlewares(): Middleware[] {
    return this.middlewares;
  }

  withMiddlewares(middlewares: Middleware[]): Configuration {
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: this.transportStrategy,
      middlewares: middlewares,
      throwOnErrors: this.throwOnErrors,
    });
  }

  withClientTimeoutMillis(clientTimeout: number): Configuration {
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy:
        this.transportStrategy.withClientTimeoutMillis(clientTimeout),
      middlewares: this.middlewares,
      throwOnErrors: this.throwOnErrors,
    });
  }

  getThrowOnErrors(): boolean {
    return this.throwOnErrors;
  }

  withThrowOnErrors(throwOnErrors: boolean): Configuration {
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: this.transportStrategy,
      middlewares: this.middlewares,
      throwOnErrors: throwOnErrors,
    });
  }
}
