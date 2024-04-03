import {RetryStrategy} from './retry/retry-strategy';
import {Middleware} from './middleware/middleware';
import {MomentoLoggerFactory} from '../';
import {TransportStrategy} from './transport';
import {ReadConcern} from '@gomomento/sdk-core';
import {CompressionProps} from './compression/compression';

export interface ConfigurationProps {
  /**
   * Configures logging verbosity and format
   */
  loggerFactory: MomentoLoggerFactory;
  /**
   * Configures how and when failed requests will be retried
   */
  retryStrategy: RetryStrategy;
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
  /**
   * Configures compression capabilities for the client.
   */
  compression: CompressionProps;
}

/**
 * Configuration options for Momento CacheClient.
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
   * @returns {RetryStrategy} the current configuration options for how and when failed requests will be retried
   */
  getRetryStrategy(): RetryStrategy;

  /**
   * Copy constructor for overriding RetryStrategy
   * @param {RetryStrategy} retryStrategy
   * @returns {Configuration} a new Configuration object with the specified RetryStrategy
   */
  withRetryStrategy(retryStrategy: RetryStrategy): Configuration;

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
   * Copy constructor that adds a single middleware to the existing middlewares
   * @param {Middleware} middleware
   * @returns {Configuration} a new Configuration object with the specified Middleware appended to the list of existing Middlewares
   */
  addMiddleware(middleware: Middleware): Configuration;

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

  /**
   * @returns {Compression} the current configuration settings for compression
   */
  getCompression(): CompressionProps;

  /**
   * Copy constructor for overriding compression settings
   * @param {Compression} compression
   * @returns {Configuration} a new Configuration object with the specified compression settings
   */
  withCompression(compression: CompressionProps): Configuration;
}

export class CacheConfiguration implements Configuration {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly retryStrategy: RetryStrategy;
  private readonly transportStrategy: TransportStrategy;
  private readonly middlewares: Middleware[];
  private readonly throwOnErrors: boolean;
  private readonly readConcern: ReadConcern;
  private readonly compression: CompressionProps;

  constructor(props: ConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
    this.retryStrategy = props.retryStrategy;
    this.transportStrategy = props.transportStrategy;
    this.middlewares = props.middlewares;
    this.throwOnErrors = props.throwOnErrors;
    this.readConcern = props.readConcern;
    this.compression = props.compression;
  }

  getLoggerFactory(): MomentoLoggerFactory {
    return this.loggerFactory;
  }

  getRetryStrategy(): RetryStrategy {
    return this.retryStrategy;
  }

  withRetryStrategy(retryStrategy: RetryStrategy): Configuration {
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: retryStrategy,
      transportStrategy: this.transportStrategy,
      middlewares: this.middlewares,
      throwOnErrors: this.throwOnErrors,
      readConcern: this.readConcern,
      compression: this.compression,
    });
  }

  getTransportStrategy(): TransportStrategy {
    return this.transportStrategy;
  }

  withTransportStrategy(transportStrategy: TransportStrategy): Configuration {
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: this.retryStrategy,
      transportStrategy: transportStrategy,
      middlewares: this.middlewares,
      throwOnErrors: this.throwOnErrors,
      readConcern: this.readConcern,
      compression: this.compression,
    });
  }

  getMiddlewares(): Middleware[] {
    return this.middlewares;
  }

  withMiddlewares(middlewares: Middleware[]): Configuration {
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: this.retryStrategy,
      transportStrategy: this.transportStrategy,
      middlewares: middlewares,
      throwOnErrors: this.throwOnErrors,
      readConcern: this.readConcern,
      compression: this.compression,
    });
  }

  addMiddleware(middleware: Middleware): Configuration {
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: this.retryStrategy,
      transportStrategy: this.transportStrategy,
      middlewares: [middleware, ...this.middlewares],
      throwOnErrors: this.throwOnErrors,
      readConcern: this.readConcern,
      compression: this.compression,
    });
  }

  withClientTimeoutMillis(clientTimeout: number): Configuration {
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: this.retryStrategy,
      transportStrategy:
        this.transportStrategy.withClientTimeoutMillis(clientTimeout),
      middlewares: this.middlewares,
      throwOnErrors: this.throwOnErrors,
      readConcern: this.readConcern,
      compression: this.compression,
    });
  }

  getThrowOnErrors(): boolean {
    return this.throwOnErrors;
  }

  withThrowOnErrors(throwOnErrors: boolean): Configuration {
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: this.retryStrategy,
      transportStrategy: this.transportStrategy,
      middlewares: this.middlewares,
      throwOnErrors: throwOnErrors,
      readConcern: this.readConcern,
      compression: this.compression,
    });
  }

  getReadConcern(): ReadConcern {
    return this.readConcern;
  }

  withReadConcern(readConcern: ReadConcern): Configuration {
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: this.retryStrategy,
      transportStrategy: this.transportStrategy,
      middlewares: this.middlewares,
      throwOnErrors: this.throwOnErrors,
      readConcern: readConcern,
      compression: this.compression,
    });
  }

  getCompression(): CompressionProps {
    return this.compression;
  }

  withCompression(compression: CompressionProps): Configuration {
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: this.retryStrategy,
      transportStrategy: this.transportStrategy,
      middlewares: this.middlewares,
      throwOnErrors: this.throwOnErrors,
      readConcern: this.readConcern,
      compression: compression,
    });
  }
}
