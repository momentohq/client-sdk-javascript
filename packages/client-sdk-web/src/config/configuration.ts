import {MomentoLoggerFactory, ReadConcern} from '@gomomento/sdk-core';
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

  /**
   * Configures the read concern for the client.
   */
  readConcern: ReadConcern;
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

  /**
   * @returns {ReadConcern} the current configuration option for read consistency
   */
  getReadConcern(): ReadConcern;

  /**
   * Copy constructor for overriding ReadConcern
   * @param {ReadConcern} readConcern
   * @returns {Configuration} a new Configuration object with the specified ReadConcern
   */
  withReadConcern(readConcern: ReadConcern): Configuration;
}

export class CacheConfiguration implements Configuration {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly transportStrategy: TransportStrategy;
  private readonly middlewares: Middleware[] = [];
  private readonly throwOnErrors: boolean;
  private readonly readConcern: ReadConcern;

  constructor(props: ConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
    this.transportStrategy = props.transportStrategy;
    this.middlewares = props.middlewares;
    this.throwOnErrors = props.throwOnErrors;
    this.readConcern = props.readConcern;
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
      readConcern: this.readConcern,
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
      readConcern: this.readConcern,
    });
  }

  withClientTimeoutMillis(clientTimeout: number): Configuration {
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy:
        this.transportStrategy.withClientTimeoutMillis(clientTimeout),
      middlewares: this.middlewares,
      throwOnErrors: this.throwOnErrors,
      readConcern: this.readConcern,
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
      readConcern: this.readConcern,
    });
  }

  getReadConcern(): ReadConcern {
    return this.readConcern;
  }

  withReadConcern(readConcern: ReadConcern): Configuration {
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: this.transportStrategy,
      middlewares: this.middlewares,
      throwOnErrors: this.throwOnErrors,
      readConcern: readConcern,
    });
  }
}
