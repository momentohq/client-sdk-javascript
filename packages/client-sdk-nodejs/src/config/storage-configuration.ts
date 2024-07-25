import {MomentoLoggerFactory, RetryStrategy} from '../';
import {StorageTransportStrategy} from './transport/storage';

// TODO: include ResponseDataReceivedTimeout as a top-level config?
// Or keep at the StorageTransportStrategy level?

/**
 * Configuration options for Momento StorageClient
 *
 * @export
 * @interface StorageConfiguration
 */
export interface StorageConfiguration {
  /**
   * @returns {MomentoLoggerFactory} the current configuration options for logging verbosity and format
   */
  getLoggerFactory(): MomentoLoggerFactory;

  /**
   * @returns {StorageTransportStrategy} the current configuration options for wire interactions with the Momento service
   */
  getTransportStrategy(): StorageTransportStrategy;

  /**
   * Convenience copy constructor that updates the client-side timeout setting in the TransportStrategy
   * @param {number} clientTimeoutMillis
   * @returns {StorageConfiguration} a new Configuration object with its TransportStrategy updated to use the specified client timeout
   */
  withClientTimeoutMillis(clientTimeoutMillis: number): StorageConfiguration;

  /**
   * Copy constructor for overriding TransportStrategy
   * @param {StorageTransportStrategy} transportStrategy
   * @returns {StorageConfiguration} a new Configuration object with the specified TransportStrategy
   */
  withTransportStrategy(
    transportStrategy: StorageTransportStrategy
  ): StorageConfiguration;

  /**
   * Copy constructor for overriding RetryStrategy
   * @param {RetryStrategy} retryStrategy
   * @returns {StorageConfiguration} a new Configuration object with the specified RetryStrategy
   */
  withRetryStrategy(retryStrategy: RetryStrategy): StorageConfiguration;
}

export interface StorageConfigurationProps {
  /**
   * Configures logging verbosity and format
   */
  loggerFactory: MomentoLoggerFactory;
  /**
   * Configures low-level options for network interactions with the Momento service
   */
  transportStrategy: StorageTransportStrategy;
  /**
   * Configures how and when failed requests will be retried
   */
  retryStrategy: RetryStrategy;
}

export class StorageClientConfiguration implements StorageConfiguration {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly transportStrategy: StorageTransportStrategy;
  private readonly retryStrategy: RetryStrategy;

  constructor(props: StorageConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
    this.transportStrategy = props.transportStrategy;
    this.retryStrategy = props.retryStrategy;
  }

  getLoggerFactory(): MomentoLoggerFactory {
    return this.loggerFactory;
  }

  getTransportStrategy(): StorageTransportStrategy {
    return this.transportStrategy;
  }

  withClientTimeoutMillis(clientTimeoutMillis: number): StorageConfiguration {
    return new StorageClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy:
        this.transportStrategy.withClientTimeoutMillis(clientTimeoutMillis),
      retryStrategy: this.retryStrategy,
    });
  }

  withTransportStrategy(
    transportStrategy: StorageTransportStrategy
  ): StorageConfiguration {
    return new StorageClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: transportStrategy,
      retryStrategy: this.retryStrategy,
    });
  }

  withRetryStrategy(retryStrategy: RetryStrategy): StorageConfiguration {
    return new StorageClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: this.transportStrategy,
      retryStrategy: retryStrategy,
    });
  }
}
