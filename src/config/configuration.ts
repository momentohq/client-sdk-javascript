import {TransportStrategy} from './transport/transport-strategy';
import {LoggerOptions} from '../utils/logging';
import {RetryStrategy} from './retry/retry-strategy';

export interface ConfigurationProps {
  /**
   * Configures logging verbosity and format
   */
  loggerOptions: LoggerOptions;
  /**
   * Configures how and when failed requests will be retried
   */
  retryStrategy: RetryStrategy;
  /**
   * Configures low-level options for network interactions with the Momento service
   */
  transportStrategy: TransportStrategy;
}

/**
 * Configuration options for Momento Simple Cache client.
 *
 * @export
 * @interface Configuration
 */
export interface Configuration {
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
   * Convenience copy constructor that updates the client-side timeout setting in the TransportStrategy
   * @param {number} clientTimeoutMillis
   * @returns {Configuration} a new Configuration object with its TransportStrategy updated to use the specified client timeout
   */
  withClientTimeoutMillis(clientTimeoutMillis: number): Configuration;
}

export class SimpleCacheConfiguration implements Configuration {
  private readonly loggerOptions: LoggerOptions;
  private readonly retryStrategy: RetryStrategy;
  private readonly transportStrategy: TransportStrategy;

  constructor(props: ConfigurationProps) {
    this.loggerOptions = props.loggerOptions;
    this.retryStrategy = props.retryStrategy;
    this.transportStrategy = props.transportStrategy;
  }

  getLoggerOptions(): LoggerOptions {
    return this.loggerOptions;
  }

  withLoggerOptions(loggerOptions: LoggerOptions): Configuration {
    return new SimpleCacheConfiguration({
      loggerOptions: loggerOptions,
      retryStrategy: this.retryStrategy,
      transportStrategy: this.transportStrategy,
    });
  }

  getRetryStrategy(): RetryStrategy {
    return this.retryStrategy;
  }

  withRetryStrategy(retryStrategy: RetryStrategy): Configuration {
    return new SimpleCacheConfiguration({
      loggerOptions: this.loggerOptions,
      retryStrategy: retryStrategy,
      transportStrategy: this.transportStrategy,
    });
  }

  getTransportStrategy(): TransportStrategy {
    return this.transportStrategy;
  }

  withTransportStrategy(transportStrategy: TransportStrategy): Configuration {
    return new SimpleCacheConfiguration({
      loggerOptions: this.loggerOptions,
      retryStrategy: this.retryStrategy,
      transportStrategy: transportStrategy,
    });
  }

  withClientTimeoutMillis(clientTimeout: number): Configuration {
    return new SimpleCacheConfiguration({
      loggerOptions: this.loggerOptions,
      retryStrategy: this.retryStrategy,
      transportStrategy:
        this.transportStrategy.withClientTimeoutMillis(clientTimeout),
    });
  }
}
