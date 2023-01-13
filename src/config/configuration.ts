import {TransportStrategy} from './transport/transport-strategy';
import {LoggerOptions} from '../utils/logging';

/**
 * Configuration options for Momento Simple Cache client.
 *
 * @export
 * @interface Configuration
 */
export interface Configuration {
  // TODO: add RetryStrategy
  // TODO: add Middlewares
  /**
   * @returns {LoggerOptions} the current configuration options for logging verbosity and format
   */
  getLoggerOptions(): LoggerOptions;

  /**
   * Copy constructor for overriding LoggerOptions
   * @param {LoggerOptions} loggerOptions
   * @returns {Configuration} a new Configuration object with the specified LoggerOptions
   */
  withLoggerOptions(loggerOptions: LoggerOptions): Configuration;

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
  // TODO: move idle millis into transport strategy
  getMaxIdleMillis(): number;
  // TODO: move idle millis into transport strategy
  withMaxIdleMillis(maxIdleMillis: number): Configuration;

  /**
   * Convenience copy constructor that updates the client-side timeout setting in the TransportStrategy
   * @param {number} clientTimeoutMillis
   * @returns {Configuration} a new Configuration object with its TransportStrategy updated to use the specified client timeout
   */
  withClientTimeoutMillis(clientTimeoutMillis: number): Configuration;
}

export class SimpleCacheConfiguration implements Configuration {
  private readonly loggerOptions: LoggerOptions;
  private readonly transportStrategy: TransportStrategy;
  private readonly maxIdleMillis: number;

  constructor(
    loggerOptions: LoggerOptions,
    transportStrategy: TransportStrategy,
    maxIdleMillis: number
  ) {
    this.loggerOptions = loggerOptions;
    this.transportStrategy = transportStrategy;
    this.maxIdleMillis = maxIdleMillis;
  }

  getLoggerOptions(): LoggerOptions {
    return this.loggerOptions;
  }

  getTransportStrategy(): TransportStrategy {
    return this.transportStrategy;
  }

  getMaxIdleMillis(): number {
    return this.maxIdleMillis;
  }

  withLoggerOptions(loggerOptions: LoggerOptions): Configuration {
    return new SimpleCacheConfiguration(
      loggerOptions,
      this.transportStrategy,
      this.maxIdleMillis
    );
  }

  withTransportStrategy(transportStrategy: TransportStrategy): Configuration {
    return new SimpleCacheConfiguration(
      this.loggerOptions,
      transportStrategy,
      this.maxIdleMillis
    );
  }

  withMaxIdleMillis(maxIdleMillis: number) {
    return new SimpleCacheConfiguration(
      this.loggerOptions,
      this.transportStrategy,
      maxIdleMillis
    );
  }

  withClientTimeoutMillis(clientTimeout: number): Configuration {
    return new SimpleCacheConfiguration(
      this.loggerOptions,
      this.transportStrategy.withClientTimeoutMillis(clientTimeout),
      this.maxIdleMillis
    );
  }
}
