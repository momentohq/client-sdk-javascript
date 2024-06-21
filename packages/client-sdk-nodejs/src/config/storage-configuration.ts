import {MomentoLoggerFactory} from '../';
import {StorageTransportStrategy} from './transport/storage';

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
   * @returns {Configuration} a new Configuration object with the specified TransportStrategy
   */
  withTransportStrategy(
    transportStrategy: StorageTransportStrategy
  ): StorageConfiguration;
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
}

export class StorageClientConfiguration implements StorageConfiguration {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly transportStrategy: StorageTransportStrategy;

  constructor(props: StorageConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
    this.transportStrategy = props.transportStrategy;
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
    });
  }

  withTransportStrategy(
    transportStrategy: StorageTransportStrategy
  ): StorageConfiguration {
    return new StorageClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: transportStrategy,
    });
  }
}
