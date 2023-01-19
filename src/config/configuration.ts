import {TransportStrategy} from './transport/transport-strategy';
import {LoggerOptions} from '../utils/logging';

export interface ConfigurationProps {
  /**
   * Configures logging verbosity and format
   */
  loggerOptions: LoggerOptions;
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

  constructor(props: ConfigurationProps) {
    this.loggerOptions = props.loggerOptions;
    this.transportStrategy = props.transportStrategy;
  }

  getLoggerOptions(): LoggerOptions {
    return this.loggerOptions;
  }

  getTransportStrategy(): TransportStrategy {
    return this.transportStrategy;
  }

  withLoggerOptions(loggerOptions: LoggerOptions): Configuration {
    return new SimpleCacheConfiguration({
      loggerOptions: loggerOptions,
      transportStrategy: this.transportStrategy,
    });
  }

  withTransportStrategy(transportStrategy: TransportStrategy): Configuration {
    return new SimpleCacheConfiguration({
      loggerOptions: this.loggerOptions,
      transportStrategy: transportStrategy,
    });
  }

  withClientTimeoutMillis(clientTimeout: number): Configuration {
    return new SimpleCacheConfiguration({
      loggerOptions: this.loggerOptions,
      transportStrategy:
        this.transportStrategy.withClientTimeoutMillis(clientTimeout),
    });
  }
}
