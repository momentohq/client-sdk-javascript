import {MomentoLoggerFactory} from '@gomomento/sdk-core';
import {TransportStrategy} from './transport';

/**
 * Configuration options for Momento VectorIndexClient
 *
 * @export
 * @interface VectorIndexConfiguration
 */
export interface VectorIndexConfiguration {
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
  withTransportStrategy(
    transportStrategy: TransportStrategy
  ): VectorIndexConfiguration;
}

export interface VectorIndexConfigurationProps {
  /**
   * Configures logging verbosity and format
   */
  loggerFactory: MomentoLoggerFactory;
  /**
   * Configures low-level options for network interactions with the Momento service
   */
  transportStrategy: TransportStrategy;
}

export class VectorIndexClientConfiguration
  implements VectorIndexConfiguration
{
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly transportStrategy: TransportStrategy;

  constructor(props: VectorIndexConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
    this.transportStrategy = props.transportStrategy;
  }

  getLoggerFactory(): MomentoLoggerFactory {
    return this.loggerFactory;
  }

  getTransportStrategy(): TransportStrategy {
    return this.transportStrategy;
  }

  withClientTimeoutMillis(
    clientTimeoutMillis: number
  ): VectorIndexConfiguration {
    return new VectorIndexClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy:
        this.transportStrategy.withClientTimeoutMillis(clientTimeoutMillis),
    });
  }

  withTransportStrategy(
    transportStrategy: TransportStrategy
  ): VectorIndexConfiguration {
    return new VectorIndexClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: transportStrategy,
    });
  }
}
